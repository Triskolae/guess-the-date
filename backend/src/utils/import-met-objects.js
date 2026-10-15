require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const knexConfig = require("../../knexfile.js");
const knex = require("knex")(knexConfig[process.env.NODE_ENV || "development"]);

const { uploadToR2 } = require("../services/r2.service");

const API = "https://collectionapi.metmuseum.org/public/collection/v1";
const SEARCH_API =
  "https://collectionapi.metmuseum.org/public/collection/v1.1/search";

const SOURCE = "met";
const BATCH = "v1";
const R2_PREFIX = `game_objects/${SOURCE}/${BATCH}`;
const TARGET_TOTAL = 200;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const DELAY_MS = 1200;
const MAX_CANDIDATES_PER_QUERY = 20;
let lastApiRequestAt = 0;

// Chaque catégorie dispose de plusieurs familles de recherche.
// Le quota est indicatif : seules les fiches admissibles sont importées.
const CATEGORY_CONFIG = [
  {
    slug: "everyday_life",
    quota: 23,
    queries: [
      "lock",
      "key",
      "lamp",
      "lantern",
      "kettle",
      "cooking pot",
      "spoon",
      "fork",
      "scissors",
      "comb",
      "mirror",
      "bottle",
      "box",
      "basket",
      "candlestick",
      "sewing tool",
      "household utensil",
    ],
  },
  {
    slug: "science",
    quota: 23,
    queries: [
      "telescope",
      "microscope",
      "astrolabe",
      "sextant",
      "compass",
      "sundial",
      "globe",
      "thermometer",
      "barometer",
      "measuring instrument",
      "slide rule",
      "scientific instrument",
      "balance scale",
      "quadrant",
    ],
  },
  {
    slug: "technology",
    quota: 23,
    queries: [
      "camera",
      "telephone",
      "typewriter",
      "radio",
      "calculator",
      "phonograph",
      "projector",
      "telegraph",
      "mechanical calculator",
      "camera obscura",
      "electrical apparatus",
      "record player",
    ],
  },
  {
    slug: "transport",
    quota: 22,
    queries: [
      "bicycle",
      "locomotive model",
      "automobile model",
      "ship model",
      "carriage",
      "saddle",
      "stirrup",
      "wheel",
      "boat model",
      "railway signal",
      "vehicle component",
      "transport equipment",
    ],
  },
  {
    slug: "art_culture",
    quota: 22,
    queries: [
      "musical instrument",
      "flute",
      "violin",
      "drum",
      "trumpet",
      "mask",
      "puppet",
      "marionette",
      "theatrical prop",
      "music box",
      "metronome",
      "wind instrument",
      "string instrument",
    ],
  },
  {
    slug: "medicine",
    quota: 22,
    queries: [
      "stethoscope",
      "syringe",
      "dental instrument",
      "surgical instrument",
      "prosthesis",
      "medical instrument",
      "forceps",
      "speculum",
      "medical apparatus",
      "surgical saw",
      "medicine chest",
    ],
  },
  {
    slug: "military",
    quota: 22,
    queries: [
      "helmet",
      "shield",
      "armor",
      "breastplate",
      "gauntlet",
      "military equipment",
      "chain mail",
      "military instrument",
      "protective armor",
      "military uniform accessory",
    ],
  },
  {
    slug: "sport_leisure",
    quota: 22,
    queries: [
      "chess set",
      "board game",
      "toy soldier",
      "mechanical toy",
      "toy vehicle",
      "ball",
      "racket",
      "skate",
      "sporting equipment",
      "playing cards",
      "game piece",
      "yo-yo",
    ],
  },
  {
    slug: "industry_engineering",
    quota: 21,
    queries: [
      "gear mechanism",
      "hand drill",
      "plane tool",
      "wrench",
      "vice",
      "caliper",
      "anvil",
      "industrial tool",
      "mechanical component",
      "workshop tool",
      "printing press component",
      "engineering instrument",
    ],
  },
];

const EXTRA_QUERIES = {
  everyday_life: [
    "teapot",
    "snuff box",
    "pocket watch",
    "inkstand",
    "candle snuffer",
    "shoe buckle",
    "fan",
    "folding screen",
    "writing desk",
    "casket",
    "oil lamp",
    "pitcher",
    "ceramic vessel",
    "textile fragment",
    "personal accessory",
  ],

  science: [
    "orrery",
    "armillary sphere",
    "electrical machine",
    "specimen jar",
    "mineral specimen",
    "surveying instrument",
    "drawing instrument",
    "measuring tape",
    "laboratory apparatus",
    "weather instrument",
  ],

  technology: [
    "printing machine",
    "sewing machine",
    "vacuum tube",
    "early computer",
    "film camera",
    "telephone switchboard",
    "electric motor",
    "wireless receiver",
    "mechanical clock",
    "calculating machine",
  ],

  transport: [
    "horse harness",
    "ship figurehead",
    "ship model",
    "railway lantern",
    "coach ornament",
    "boat oar",
    "sleigh",
    "bicycle component",
    "navigation instrument",
  ],

  art_culture: [
    "puppet",
    "theatre mask",
    "musical automaton",
    "music manuscript",
    "ceremonial mask",
    "printing block",
    "calligraphy tool",
    "musical score",
    "sculpture",
    "decorative tile",
  ],

  medicine: [
    "apothecary jar",
    "medicine bottle",
    "medical case",
    "anatomical model",
    "hearing aid",
    "surgical kit",
    "dental key",
    "bloodletting instrument",
  ],

  military: [
    "sword hilt",
    "powder flask",
    "military medal",
    "shield boss",
    "arrowhead",
    "spearhead",
    "ammunition box",
    "military drum",
    "uniform button",
  ],

  sport_leisure: [
    "dominoes",
    "mahjong set",
    "doll",
    "kite",
    "toy theatre",
    "marbles",
    "golf club",
    "fishing reel",
    "ice skate",
    "musical toy",
  ],

  industry_engineering: [
    "blacksmith tool",
    "lathe tool",
    "mold",
    "printing type",
    "textile tool",
    "loom component",
    "woodworking plane",
    "metalworking tool",
    "engineering model",
    "pulley",
  ],
};

for (const config of CATEGORY_CONFIG) {
  config.queries.push(...EXTRA_QUERIES[config.slug]);
}

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
      error,
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
          `(${((Date.now() - requestStart) / 1000).toFixed(1)} s)`,
      );
    } catch (error) {
      logError(
        `API réseau — ${url} (${((Date.now() - requestStart) / 1000).toFixed(1)} s)`,
        error,
      );

      if (attempt === attempts - 1) throw error;
      await sleep(1500 * 2 ** attempt);
      continue;
    }

    if (response.status === 403) {
      const body = (await response.text()).slice(0, 500);
      const error = new Error(
        `MET_BLOCKED_403: accès refusé. Réponse: ${body}`,
      );
      error.code = "MET_BLOCKED";
      throw error;
    }

    if (response.status === 429) {
      const error = new Error(
        "MET_RATE_LIMIT_429: limite de requêtes atteinte.",
      );
      error.code = "MET_BLOCKED";
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

async function searchIds(query, offset = 0) {
  const params = new URLSearchParams({
    q: query,
    hasImages: "true",
    offset: String(offset),
    limit: "100",
  });

  const result = await getJson(`${SEARCH_API}?${params}`);
  return result.objectIDs || [];
}

async function getObject(id) {
  return getJson(`${API}/objects/${id}`);
}

function normalizeDate(object) {
  const start = Number(object.objectBeginDate);
  const end = Number(object.objectEndDate);

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start === -1 ||
    end === -1 ||
    start === 0 ||
    end === 0
  ) {
    return null;
  }

  return {
    yearStart: Math.min(start, end),
    yearEnd: Math.max(start, end),
    representativeYear: Math.round((start + end) / 2),
    dateDisplay: object.objectDate || null,
  };
}

function findEra(eras, year) {
  return eras.find(
    (era) =>
      (era.start_year === null || year >= era.start_year) &&
      (era.end_year === null || year <= era.end_year),
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

// Rejette les fiches qui représentent essentiellement des images,
// des documents ou des portraits plutôt que des objets physiques.
function isLikelyPhysicalObject(object) {
  const title = normalizeText(object.title);
  const type = normalizeText(object.objectName);
  const classification = normalizeText(object.classification);
  const combined = `${title} ${type} ${classification}`;

  const excludedTypes = [
    "photograph",
    "photograph album",
    "print",
    "engraving",
    "lithograph",
    "drawing",
    "painting",
    "poster",
    "book",
    "trade catalogue",
    "manuscript",
  ];

  if (excludedTypes.some((word) => type === word || classification === word)) {
    return false;
  }

  const excludedTitlePatterns = [
    /^portrait of /,
    /^self portrait/,
    /^photograph of /,
    /^frontispiece/,
    /^design for /,
    /^catalogue of /,
    /^from the .* series/,
  ];

  if (excludedTitlePatterns.some((pattern) => pattern.test(title))) {
    return false;
  }

  // Évite les cas manifestement centrés sur une représentation.
  if (
    combined.includes("portrait of") ||
    combined.includes("self portrait") ||
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

async function uploadImage(object) {
  const imageSourceUrl = object.primaryImageSmall || object.primaryImage;

  if (!imageSourceUrl) {
    throw new Error("Image principale absente");
  }

  const response = await fetch(imageSourceUrl, {
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

  const key = `${R2_PREFIX}/objects/${object.objectID}.${image.extension}`;

  const imageUrl = await uploadToR2(buffer, key, image.type);

  if (!imageUrl) {
    throw new Error("URL R2 absente après upload");
  }

  return {
    imageUrl,
    imageSourceUrl,
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
  manifest,
) {
  let imported = 0;
  let rejected = 0;
  let processed = 0;

  console.log(`\n[${config.slug}] Objectif : ${config.quota}`);
  const shuffledQueries = [...config.queries].sort(() => Math.random() - 0.5);

  for (const query of shuffledQueries) {
    if (imported >= config.quota) break;

    let importedForQuery = 0;
    let candidatesForQuery = 0;

    console.log(`Recherche : ${query}`);

    // Exploration paginée pour trouver suffisamment de candidats.
    for (
      let offset = 0;
      offset < 1000 &&
      imported < config.quota &&
      importedForQuery < 2 &&
      candidatesForQuery < MAX_CANDIDATES_PER_QUERY;
      offset += 100
    ) {
      let ids;

      try {
        ids = await searchIds(query, offset);
      } catch (error) {
        if (error.code === "MET_BLOCKED") throw error;

        console.warn(`Recherche ignorée (${query}) : ${error.message}`);
        break;
      }

      if (!ids.length) break;

      for (const id of ids) {
        if (
          imported >= config.quota ||
          importedForQuery >= 2 ||
          candidatesForQuery >= MAX_CANDIDATES_PER_QUERY
        ) {
          break;
        }

        processed++;

        log(
          `[${config.slug}] candidat #${processed} — ID Met ${id} — ` +
            `importés ${imported}/${config.quota}, rejetés ${rejected}`,
        );
        if (imported >= config.quota || importedForQuery >= 2) break;
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

          log(`FICHE — récupération de l'objet Met ${id}`);
          const object = await getObject(id);
          log(
            `FICHE — objet ${id} récupéré : ${object.title || "(sans titre)"}`,
          );

          if (
            object.isPublicDomain !== true ||
            (!object.primaryImage && !object.primaryImageSmall)
          ) {
            rejected++;
            continue;
          }

          if (!isLikelyPhysicalObject(object)) {
            rejected++;
            continue;
          }

          const date = normalizeDate(object);

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
            object.title?.trim() || object.objectName?.trim() || `Object ${id}`;

          // Déduplication des titres entre toutes les catégories.
          const titleKey = normalizeText(title);

          if (seenTitles.has(titleKey)) {
            rejected++;
            continue;
          }

          // Limite les répétitions d'un même type de fiche.
          // Les valeurs vides ne sont pas utilisées comme signature.
          const typeKey = normalizeText(
            object.objectName || object.classification,
          );

          const typeCount = typeKey ? seenTypes.get(typeKey) || 0 : 0;

          if (typeKey && typeCount >= 5) {
            rejected++;
            continue;
          }

          log(`IMAGE — téléchargement et upload R2 pour ${id}`);
          const image = await timed(`Image + R2 pour ${id}`, () =>
            uploadImage(object),
          );

          const record = {
            source: SOURCE,
            source_object_id: String(object.objectID),
            batch_name: BATCH,
            title,
            description: object.objectDescription || null,
            creator: object.artistDisplayName || null,

            category_id: categoryId,
            era_id: era.id,

            year_start: date.yearStart,
            year_end: date.yearEnd,
            date_display: date.dateDisplay,

            image_url: image.imageUrl,
            image_source_url: image.imageSourceUrl,
            image_rights: image.imageRights,

            source_url:
              object.objectURL ||
              `https://www.metmuseum.org/art/collection/search/${id}`,

            source_metadata: {
              department: object.department || null,
              objectName: object.objectName || null,
              classification: object.classification || null,
              medium: object.medium || null,
              culture: object.culture || null,
              period: object.period || null,
              objectBeginDate: object.objectBeginDate,
              objectEndDate: object.objectEndDate,
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
            sourceObjectId: String(object.objectID),
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
          importedForQuery++;

          console.log(
            `✓ ${title} | ${date.yearStart}–${date.yearEnd} | ` +
              `${config.slug} | ${era.slug}`,
          );
        } catch (error) {
          if (error.code === "MET_BLOCKED") throw error;

          rejected++;
          console.warn(`Objet ${id} ignoré : ${error.message}`);
        }
      }

      if (ids.length < 100) break;
    }
    log(
      `FIN RECHERCHE "${query}" — ` +
        `${candidatesForQuery} candidats examinés, ` +
        `${importedForQuery} importé(s)`,
    );
  }

  console.log(
    `[${config.slug}] ${imported}/${config.quota} ajoutés ; ` +
      `${rejected} candidats ignorés`,
  );

  return imported;
}

async function main() {
  log("IMPORT — démarrage");

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
      "end_year",
    );

    const categoryIds = new Map(
      categories.map((category) => [category.slug, category.id]),
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
          `ou nettoie explicitement le batch de test avant de le relancer.`,
      );
    }

    const existingTotal = await knex("objects")
      .where({ source: SOURCE })
      .count({ count: "*" })
      .first();

    console.log(`Objets Met déjà présents en BDD : ${existingTotal.count}`);
    console.log(`Destination R2 : ${R2_PREFIX}/`);

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
        manifest,
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
      "application/json",
    );

    console.log("\nImport terminé.");
    console.log(`Objets importés : ${totalImported}/${TARGET_TOTAL}`);
    console.log(`Manifeste : ${manifestUrl}`);

    if (totalImported < TARGET_TOTAL) {
      console.warn(
        `Il manque ${TARGET_TOTAL - totalImported} objet(s). ` +
          "Certaines catégories ou recherches n'ont pas fourni assez " +
          "de fiches admissibles.",
      );
    }

    console.log("\nRépartition du batch :");
    console.table(
      CATEGORY_CONFIG.map((config) => ({
        category: config.slug,
        imported: manifest.filter((object) => object.category === config.slug)
          .length,
        target: config.quota,
      })),
    );
  } finally {
    log(
      `IMPORT — fermeture de la base, dernière catégorie : ${currentCategory}`,
    );
    await knex.destroy();
  }
}

main().catch((error) => {
  console.error("Échec de l'import :", error);
  process.exitCode = 1;
});
