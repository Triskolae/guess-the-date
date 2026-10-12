const COMMONS_API =
  "https://commons.wikimedia.org/w/api.php";


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// =========================================================
// FETCH AVEC RETRY
// =========================================================

async function fetchWithRetry(
  url,
  options = {},
  retries = 4
) {
  for (
    let attempt = 0;
    attempt <= retries;
    attempt++
  ) {

    const response =
      await fetch(url, options);


    if (response.ok) {
      return response;
    }


    if (response.status === 429) {

      if (attempt === retries) {
        throw new Error(
          "Erreur Commons : 429 après plusieurs tentatives"
        );
      }


      const retryAfter =
        Number(
          response.headers.get(
            "retry-after"
          )
        );


      const waitTime =
        Number.isFinite(retryAfter) &&
        retryAfter > 0
          ? retryAfter * 1000
          : 5000 * (attempt + 1);


      console.log(
        `⏳ Commons 429 → attente de ${waitTime / 1000}s`
      );


      await sleep(waitTime);

      continue;
    }


    if (
      response.status >= 500 &&
      attempt < retries
    ) {

      const waitTime =
        3000 * (attempt + 1);


      console.log(
        `⏳ Commons ${response.status} → nouvel essai dans ${waitTime / 1000}s`
      );


      await sleep(waitTime);

      continue;
    }


    throw new Error(
      `Erreur Commons : ${response.status}`
    );
  }
}


// =========================================================
// RÉCUPÉRER NOM DU FICHIER
// =========================================================

function getFilenameFromUrl(imageUrl) {

  if (!imageUrl) {
    return null;
  }


  const marker =
    "/wiki/Special:FilePath/";


  const index =
    imageUrl.indexOf(marker);


  if (index === -1) {
    return null;
  }


  return decodeURIComponent(
    imageUrl.substring(
      index + marker.length
    )
  );
}


// =========================================================
// EXTRAIRE INFOS IMAGE
// =========================================================

function extractImageInfo(page) {

  const info =
    page?.imageinfo?.[0];


  if (!info) {
    return null;
  }


  const metadata =
    info.extmetadata ?? {};


  return {

    filename:
      page.title?.replace(
        /^File:/,
        ""
      ) ?? null,

    license:
      metadata.LicenseShortName
        ?.value ?? null,

    licenseUrl:
      metadata.LicenseUrl
        ?.value ?? null,

    usageTerms:
      metadata.UsageTerms
        ?.value ?? null,

    copyrighted:
      metadata.Copyrighted
        ?.value ?? null,

    artist:
      metadata.Artist
        ?.value ?? null,

    attribution:
      metadata.Attribution
        ?.value ?? null,

    originalUrl:
      info.url ?? null,

    mime:
      info.mime ?? null,
  };
}


// =========================================================
// VÉRIFIER PERTINENCE DU NOM DE FICHIER
// =========================================================

function isFilenameRelevant(
  filename,
  searchTerm
) {

  if (!filename || !searchTerm) {
    return false;
  }


  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[_\-().]/g,
        " "
      );


  const normalizedFilename =
    normalize(filename);


  const words =
    normalize(searchTerm)
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 4
      );


  if (words.length === 0) {
    return false;
  }


  // Au moins tout les mot important
  // doivent apparaître dans le nom du fichier
  return words.every(
  (word) =>
    normalizedFilename.includes(
      word
    )
  );
}


// =========================================================
// INFORMATIONS IMAGE WIKIDATA
// =========================================================

async function getCommonsImageInfo(
  imageUrl
) {

  const filename =
    getFilenameFromUrl(
      imageUrl
    );


  if (!filename) {
    return null;
  }


  const params =
    new URLSearchParams({

      action: "query",

      titles:
        `File:${filename}`,

      prop: "imageinfo",

      iiprop:
        "url|mime|extmetadata",

      format: "json",

      origin: "*",

    });


  const response =
    await fetchWithRetry(

      `${COMMONS_API}?${params.toString()}`,

      {
        headers: {
          "User-Agent":
            "GuessTheDate/1.0",
        },
      }

    );


  const data =
    await response.json();


  const pages =
    Object.values(
      data.query?.pages ?? {}
    );


  if (pages.length === 0) {
    return null;
  }


  return extractImageInfo(
    pages[0]
  );
}


// =========================================================
// LICENCE AUTORISÉE
// =========================================================

function isLicenseAllowed(info) {

  if (
    !info ||
    !info.license
  ) {
    return false;
  }


  const allowedLicenses = [
    "Public domain",
    "CC0",
  ];


  return allowedLicenses.includes(
    info.license
  );
}


// =========================================================
// FORMAT AUTORISÉ
// =========================================================

function isImageFormatAllowed(info) {

  if (
    !info ||
    !info.mime
  ) {
    return false;
  }


  const allowedFormats = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];


  return allowedFormats.includes(
    info.mime
  );
}


// =========================================================
// CHERCHER UNE IMAGE ALTERNATIVE
// =========================================================

async function findAlternativeLicensedImage(
  searchTerm,
  requiredTerm = searchTerm,
  limit = 50
) {

  const params =
    new URLSearchParams({

      action: "query",

      generator: "search",

      gsrnamespace: "6",

      gsrsearch:
        searchTerm,

      gsrlimit:
        String(limit),

      prop: "imageinfo",

      iiprop:
        "url|mime|extmetadata",

      format: "json",

      origin: "*",

    });


  const response =
    await fetchWithRetry(

      `${COMMONS_API}?${params.toString()}`,

      {
        headers: {
          "User-Agent":
            "GuessTheDate/1.0",
        },
      }

    );


  const data =
    await response.json();


  const pages =
    Object.values(
      data.query?.pages ?? {}
    );


  for (const page of pages) {

    const imageInfo =
      extractImageInfo(page);


    if (!imageInfo) {
      continue;
    }


    // L'image doit être liée
    // au nom de l'objet
    if (
      !isFilenameRelevant(
        imageInfo.filename,
        requiredTerm
      )   
    ) {
      continue;
    }


    if (
      !isLicenseAllowed(
        imageInfo
      )
    ) {
      continue;
    }


    if (
      !isImageFormatAllowed(
        imageInfo
      )
    ) {
      continue;
    }


    return imageInfo;
  }


  return null;
}


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getCommonsImageInfo,
  findAlternativeLicensedImage,
  isLicenseAllowed,
  isImageFormatAllowed,
  isFilenameRelevant,
};


// =========================================================
// TEST TEMPORAIRE
// =========================================================

async function test() {

  try {

    const image =
      await findAlternativeLicensedImage(
        "modern vacuum cleaner",
        "vacuum cleaner"
    );


    console.log(image);

  } catch (error) {

    console.error(
      error.message
    );

  }
}


if (require.main === module) {
  test();
}