require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const knexConfig = require("../../knexfile.js");
const knex = require("knex")(knexConfig[process.env.NODE_ENV || "development"]);

const { uploadToR2 } = require("../services/r2.service");

// L'API Smithsonian nécessite une clé API (obtenable gratuitement sur https://api.data.gov/signup/)
// La clé DEMO_KEY convient pour quelques requêtes de test.
const SMITHSONIAN_API_KEY = process.env.SMITHSONIAN_API_KEY || "DEMO_KEY";
const SEARCH_API = "https://api.si.edu/openaccess/api/v1.0/search";
const OBJECT_API = "https://api.si.edu/openaccess/api/v1.0/content";

const SOURCE = "smithsonian";
const BATCH = "v1";
const R2_PREFIX = `game_objects/${SOURCE}/${BATCH}`;
const TARGET_TOTAL = 200;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const DELAY_MS = 1000;
const MAX_CANDIDATES_PER_QUERY = 10;
let lastApiRequestAt = 0;

// Config des catégories adaptées aux collections du Smithsonian
const CATEGORY_CONFIG = [
  {
    slug: "everyday_life",
    quota: 23,
    queries: [
      "coffee grinder",
      "waffle iron",
      "butter churn",
      "mousetrap",
      "hair curler",
      "pocket knife",
      "spectacles",
      "snuff box",
      "safety razor",
      "matchbox",
      "corkscrew",
      "toaster",
      "flat iron",
      "bed warmer",
      "nutcracker",
      "shoehorn",
      "porcelain chamber pot",
      "vintage vending machine",
      "stereoscope",
    ],
  },
  {
    slug: "science",
    quota: 23,
    queries: [
      "planetarium model",
      "magic lantern",
      "prism",
      "electrometer",
      "phrenology head",
      "crystallography model",
      "theodolite",
      "vacuum pump",
      "zoetrope",
      "kaleidoscope",
      "camera lucida",
      "tellurion",
      "galvanometer",
      "meteorite fragment",
      "diorama",
      "volcano model",
    ],
  },
  {
    slug: "technology",
    quota: 23,
    queries: [
      "space helmet",
      "spacesuit glove",
      "apollo camera",
      "early television",
      "jukebox",
      "arcade cabinet",
      "pager",
      "walkman",
      "slot machine",
      "pinball machine",
      "early computer mouse",
      "punch card machine",
      "teletype",
      "solar panel model",
      "radar tube",
      "robot prototype",
    ],
  },
  {
    slug: "transport",
    quota: 22,
    queries: [
      "unicycle",
      "penny farthing",
      "space capsule model",
      "hot air balloon basket",
      "rickshaw",
      "toboggan",
      "snowshoe",
      "hovercraft model",
      "propeller blade",
      "submarine periscope",
      "train headlight",
      "vintage license plate",
      "glider wing",
      "ship wheel",
    ],
  },
  {
    slug: "art_culture",
    quota: 22,
    queries: [
      "accordion",
      "theremin",
      "gramophone horn",
      "ventriloquist dummy",
      "shadow puppet",
      "magic trick prop",
      "carnival mask",
      "hurdy gurdy",
      "jukebox mechanism",
      "theatre opera glass",
      "harmonica",
      "banjo",
      "wooden marionette",
      "caroussel horse",
    ],
  },
  {
    slug: "medicine",
    quota: 22,
    queries: [
      "apothecary scale",
      "glass eye",
      "ear trumpet",
      "leeching jar",
      "respirator mask",
      "vintage wheelchair",
      "x-ray tube",
      "mortarium",
      "medical tonic bottle",
      "dental chair",
      "ether inhaler",
      "vaccination kit",
      "vintage stethoscope",
    ],
  },
  {
    slug: "military",
    quota: 22,
    queries: [
      "periscope rifle",
      "code breaker machine",
      "gas mask",
      "canteen",
      "bugle",
      "trench art",
      "trench shovel",
      "pith helmet",
      "signal lamp",
      "military compass",
      "flight jacket",
      "camouflage net",
      "mess kit",
    ],
  },
  {
    slug: "sport_leisure",
    quota: 22,
    queries: [
      "vintage roller skates",
      "bowling pin",
      "boomerang",
      "jack in the box",
      "view-master",
      "tin toy",
      "croquet mallet",
      "vintage baseball glove",
      "wooden skis",
      "pogo stick",
      "magic 8 ball",
      "puppet theatre",
      "slot car",
    ],
  },
  {
    slug: "industry_engineering",
    quota: 21,
    queries: [
      "steam engine model",
      "printing block",
      "surveyor chain",
      "waterwheel model",
      "blacksmith bellows",
      "glass blowing pipe",
      "cotton gin model",
      "mining lamp",
      "riveting gun",
      "foundry mold",
      "telegraph key",
      "micrometer",
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const startedAt = Date.now();

function log(message) {
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[${new Date().toISOString()}] [+${elapsed}s] ${message}`);
}

function logError(message, error) {
  log(`ERREUR — ${message}: ${error?.stack || error?.message || error}`);
}

async function timed(label, operation) {
  const start = Date.now();
  log(`DÉBUT — ${label}`);

  try {
    const result = await operation();
    log(`OK — ${label} (${((Date.now() - start) / 1000).toFixed(1)} s)`);
    return result;
  } catch (error) {
    logError(
      `${label} après ${((Date.now() - start) / 1000).toFixed(1)} s`,
      error
    );
    throw error;
  }
}

async function getJson(url, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const elapsed = Date.now() - lastApiRequestAt;

    if (elapsed < DELAY_MS) {
      await sleep(DELAY_MS - elapsed);
    }

    lastApiRequestAt = Date.now();

    let response;
    const requestStart = Date.now();

    log(`API → GET ${url}`);

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: {
          "User-Agent": "HistoricalObjectsGame/1.0",
          Accept: "application/json",
        },
      });

      log(
        `API ← HTTP ${response.status} — ${url} ` +
          `(${((Date.now() - requestStart) / 1000).toFixed(1)} s)`
      );
    } catch (error) {
      logError(
        `API réseau — ${url} (${((Date.now() - requestStart) / 1000).toFixed(1)} s)`,
        error
      );

      if (attempt === attempts - 1) throw error;
      await sleep(1500 * 2 ** attempt);
      continue;
    }

    if (response.status === 429) {
      const error = new Error("SMITHSONIAN_RATE_LIMIT_429: limite de requêtes atteinte.");
      error.code = "SMITHSONIAN_BLOCKED";
      throw error;
    }

    if (response.status >= 500 && attempt < attempts - 1) {
      await sleep(1500 * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} pour ${url}`);
    }

    return response.json();
  }

  throw new Error("Échec de la requête API après plusieurs tentatives.");
}

async function searchObjects(query, start = 0) {
  const params = new URLSearchParams({
    api_key: SMITHSONIAN_API_KEY,
    q: `${query} AND online_media_type:Images AND media_usage:CC0`,
    start: String(start),
    rows: "20",
  });

  const result = await getJson(`${SEARCH_API}?${params}`);
  return result?.response?.rows || [];
}

async function getObjectDetails(id) {
  const params = new URLSearchParams({
    api_key: SMITHSONIAN_API_KEY,
  });

  const result = await getJson(`${OBJECT_API}/${id}?${params}`);
  return result?.response || null;
}

function normalizeDate(content) {
  // Tente d'abord de récupérer les dates structurées
  const indexedDates = content?.indexedStructured?.date;
  if (Array.isArray(indexedDates) && indexedDates.length > 0) {
    const yearMatch = indexedDates[0].match(/\b(\d{3,4})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return {
        yearStart: year,
        yearEnd: year,
        representativeYear: year,
        dateDisplay: String(year),
      };
    }
  }

  // Si pas de date structurée, regarde dans le texte libre
  const freetextDates = content?.freetext?.date;
  if (Array.isArray(freetextDates)) {
    for (const entry of freetextDates) {
      const yearMatch = entry.content?.match(/\b(\d{3,4})\b/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        return {
          yearStart: year,
          yearEnd: year,
          representativeYear: year,
          dateDisplay: entry.content,
        };
      }
    }
  }

  return null;
}

function findEra(eras, year) {
  return eras.find(
    (era) =>
      (era.start_year === null || year >= era.start_year) &&
      (era.end_year === null || year <= era.end_year)
  );
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isLikelyPhysicalObject(content) {
  const title = normalizeText(content.title);
  const type = normalizeText(content.freetext?.objectType?.[0]?.content);
  const combined = `${title} ${type}`;

  const excludedTypes = [
    "photograph",
    "print",
    "drawing",
    "painting",
    "poster",
    "book",
    "manuscript",
    "archival material",
  ];

  if (excludedTypes.some((word) => type === word)) {
    return false;
  }

  if (
    combined.includes("portrait of") ||
    combined.includes("photograph of") ||
    combined.includes("frontispiece")
  ) {
    return false;
  }

  return true;
}

function getImageExtension(contentType, buffer) {
  const type = contentType.split(";")[0].trim().toLowerCase();

  if (type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { type, extension: "jpg" };
  }

  if (
    type === "image/png" &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { type, extension: "png" };
  }

  if (
    type === "image/webp" &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { type, extension: "webp" };
  }

  return null;
}

async function uploadImage(objectId, imageUrlSource) {
  if (!imageUrlSource) {
    throw new Error("URL d'image source manquante");
  }

  const response = await fetch(imageUrlSource, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Téléchargement image : HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const declaredLength = Number(response.headers.get("content-length") || 0);

  if (declaredLength > MAX_IMAGE_BYTES) {
    throw new Error("Image trop volumineuse");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Taille d'image invalide");
  }

  const image = getImageExtension(contentType, buffer);

  if (!image) {
    throw new Error("Format d'image non accepté");
  }

  // Assainissement de l'ID pour le chemin de fichier R2
  const cleanId = String(objectId).replace(/[^a-zA-Z0-9_-]/g, "_");
  const key = `${R2_PREFIX}/objects/${cleanId}.${image.extension}`;

  const imageUrl = await uploadToR2(buffer, key, image.type);

  if (!imageUrl) {
    throw new Error("URL R2 absente après upload");
  }

  return {
    imageUrl,
    imageSourceUrl: imageUrlSource,
    imageRights: "CC0",
    r2Key: key,
  };
}

async function importCategory(
  config,
  categoryId,
  eras,
  seenIds,
  seenTitles,
  seenTypes,
  manifest
) {
  let imported = 0;
  let rejected = 0;
  let processed = 0;

  console.log(`\n[${config.slug}] Objectif : ${config.quota}`);
  const shuffledQueries = [...config.queries].sort(() => Math.random() - 0.5);

  for (const query of shuffledQueries) {
    if (imported >= config.quota) break;

    let candidatesForQuery = 0;

    console.log(`Recherche : ${query}`);

    for (
      let start = 0;
      start < 100 &&
      imported < config.quota &&
      candidatesForQuery < MAX_CANDIDATES_PER_QUERY;
      start += 20
    ) {
      let items;

      try {
        items = await searchObjects(query, start);
      } catch (error) {
        if (error.code === "SMITHSONIAN_BLOCKED") throw error;
        console.warn(`Recherche ignorée (${query}) : ${error.message}`);
        break;
      }

      if (!items.length) break;

      for (const item of items) {
        if (
          imported >= config.quota ||
          candidatesForQuery >= MAX_CANDIDATES_PER_QUERY
        ) {
          break;
        }

        processed++;
        const id = item.id;

        log(
          `[${config.slug}] candidat #${processed} — ID Smithsonian ${id} — ` +
            `importés ${imported}/${config.quota}, rejetés ${rejected}`
        );

        if (seenIds.has(id)) continue;
        seenIds.add(id);
        candidatesForQuery++;

        await sleep(DELAY_MS);

        try {
          const existing = await knex("objects")
            .where({
              source: SOURCE,
              source_object_id: String(id),
            })
            .first("id");

          if (existing) {
            rejected++;
            continue;
          }

          log(`FICHE — récupération détaillée de l'objet ${id}`);
          const details = await getObjectDetails(id);
          const content = details?.content || item.content;

          if (!content) {
            rejected++;
            continue;
          }

          // Vérification de la présence d'une image
          const media = content.descriptiveNonRepeating?.online_media?.media;
          const imageObj = media?.find(
            (m) => m.type === "Images" || m.thumbnail
          );
          const primaryImageUrl = imageObj?.resources?.find(
            (r) => r.label === "High-resolution" || r.label === "Screen Image" || r.label === "Thumbnail"
          )?.url || imageObj?.thumbnail;

          if (!primaryImageUrl) {
            rejected++;
            continue;
          }

          if (!isLikelyPhysicalObject(content)) {
            rejected++;
            continue;
          }

          const date = normalizeDate(content);
          if (!date) {
            rejected++;
            continue;
          }

          const era = findEra(eras, date.representativeYear);
          if (!era) {
            rejected++;
            continue;
          }

          const title =
            content.title?.trim() ||
            content.descriptiveNonRepeating?.title?.content?.trim() ||
            `Object ${id}`;

          const titleKey = normalizeText(title);
          if (seenTitles.has(titleKey)) {
            rejected++;
            continue;
          }

          const objectType = content.freetext?.objectType?.[0]?.content || "";
          const typeKey = normalizeText(objectType);
          const typeCount = typeKey ? seenTypes.get(typeKey) || 0 : 0;

          if (typeKey && typeCount >= 5) {
            rejected++;
            continue;
          }

          log(`IMAGE — téléchargement et upload R2 pour ${id}`);
          const image = await timed(`Image + R2 pour ${id}`, () =>
            uploadImage(id, primaryImageUrl)
          );

          const record = {
            source: SOURCE,
            source_object_id: String(id),
            batch_name: BATCH,
            title,
            description: content.freetext?.notes?.[0]?.content || null,
            creator: content.freetext?.name?.[0]?.content || null,

            category_id: categoryId,
            era_id: era.id,

            year_start: date.yearStart,
            year_end: date.yearEnd,
            date_display: date.dateDisplay,

            image_url: image.imageUrl,
            image_source_url: image.imageSourceUrl,
            image_rights: image.imageRights,

            source_url:
              content.descriptiveNonRepeating?.record_link ||
              `https://3d.si.edu/object/3d/${id}`,

            source_metadata: {
              unitCode: content.descriptiveNonRepeating?.unit_code || null,
              objectType: objectType || null,
              data_source: content.descriptiveNonRepeating?.data_source || null,
              importedAt: new Date().toISOString(),
              batch: BATCH,
              r2Key: image.r2Key,
            },
          };

          await knex("objects").insert(record);

          seenTitles.add(titleKey);
          if (typeKey) seenTypes.set(typeKey, typeCount + 1);

          manifest.push({
            source: SOURCE,
            sourceObjectId: String(id),
            title,
            category: config.slug,
            era: era.slug,
            yearStart: date.yearStart,
            yearEnd: date.yearEnd,
            imageUrl: image.imageUrl,
            imageSourceUrl: image.imageSourceUrl,
            imageRights: image.imageRights,
            r2Key: image.r2Key,
            sourceUrl: record.source_url,
          });

          imported++;

          console.log(
            `✓ ${title} | ${date.yearStart}–${date.yearEnd} | ` +
              `${config.slug} | ${era.slug}`
          );
        } catch (error) {
          if (error.code === "SMITHSONIAN_BLOCKED") throw error;

          rejected++;
          console.warn(`Objet ${id} ignoré : ${error.message}`);
        }
      }

      if (items.length < 20) break;
    }
  }

  console.log(
    `[${config.slug}] ${imported}/${config.quota} ajoutés ; ` +
      `${rejected} candidats ignorés`
  );

  return imported;
}

async function main() {
  log("IMPORT SMITHSONIAN — démarrage");

  let currentCategory = "initialisation";
  const seenIds = new Set();
  const seenTitles = new Set();
  const seenTypes = new Map();
  const manifest = [];

  try {
    const categories = await knex("categories").select("id", "slug");
    const eras = await knex("eras").select(
      "id",
      "slug",
      "start_year",
      "end_year"
    );

    const categoryIds = new Map(
      categories.map((category) => [category.slug, category.id])
    );

    for (const config of CATEGORY_CONFIG) {
      if (!categoryIds.has(config.slug)) {
        throw new Error(`Catégorie absente de la BDD : ${config.slug}`);
      }
    }

    if (!eras.length) {
      throw new Error("Aucune ère trouvée dans la table eras");
    }

    const existingBatch = await knex("objects")
      .where({
        source: SOURCE,
        batch_name: BATCH,
      })
      .count({ count: "*" })
      .first();

    if (Number(existingBatch.count) > 0) {
      throw new Error(
        `Le batch ${SOURCE}/${BATCH} contient déjà ` +
          `${existingBatch.count} objet(s). Utilise une nouvelle version ` +
          `ou nettoie le batch de test avant de relancer.`
      );
    }

    let totalImported = 0;

    for (const config of CATEGORY_CONFIG) {
      if (totalImported >= TARGET_TOTAL) break;

      const quota = Math.min(config.quota, TARGET_TOTAL - totalImported);

      currentCategory = config.slug;
      log(`CATÉGORIE — début ${currentCategory}`);
      totalImported += await importCategory(
        { ...config, quota },
        categoryIds.get(config.slug),
        eras,
        seenIds,
        seenTitles,
        seenTypes,
        manifest
      );
      log(`CATÉGORIE — fin ${currentCategory}`);
    }

    const manifestData = {
      source: SOURCE,
      batch: BATCH,
      createdAt: new Date().toISOString(),
      requestedTotal: TARGET_TOTAL,
      importedTotal: totalImported,
      objects: manifest,
    };

    const manifestUrl = await uploadToR2(
      Buffer.from(JSON.stringify(manifestData, null, 2)),
      `${R2_PREFIX}/manifest.json`,
      "application/json"
    );

    console.log("\nImport terminé.");
    console.log(`Objets importés : ${totalImported}/${TARGET_TOTAL}`);
    console.log(`Manifeste : ${manifestUrl}`);

    console.log("\nRépartition du batch :");
    console.table(
      CATEGORY_CONFIG.map((config) => ({
        category: config.slug,
        imported: manifest.filter((object) => object.category === config.slug)
          .length,
        target: config.quota,
      }))
    );
  } finally {
    log(
      `IMPORT — fermeture de la base, dernière catégorie : ${currentCategory}`
    );
    await knex.destroy();
  }
}

main().catch((error) => {
  console.error("Échec de l'import :", error);
  process.exitCode = 1;
});
