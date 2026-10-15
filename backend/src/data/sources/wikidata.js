const WIKIDATA_API =
  "https://www.wikidata.org/w/api.php";


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function fetchWithRetry(
  url,
  options = {},
  retries = 4
) {
  for (let attempt = 0; attempt <= retries; attempt++) {

    const response = await fetch(
      url,
      options
    );


    // Requête réussie
    if (response.ok) {
      return response;
    }


    // Wikidata nous limite
    if (response.status === 429) {

      if (attempt === retries) {
        throw new Error(
          "Erreur Wikidata : 429 après plusieurs tentatives"
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
        `⏳ Wikidata 429 → attente de ${waitTime / 1000}s`
      );


      await sleep(waitTime);

      continue;
    }


    // Erreurs serveur : on peut réessayer
    if (
      response.status >= 500 &&
      attempt < retries
    ) {

      const waitTime =
        3000 * (attempt + 1);


      console.log(
        `⏳ Wikidata ${response.status} → nouvel essai dans ${waitTime / 1000}s`
      );


      await sleep(waitTime);

      continue;
    }


    throw new Error(
      `Erreur Wikidata : ${response.status}`
    );
  }
}


function getClaimValue(
  claims,
  property
) {
  const propertyClaims =
    claims?.[property];


  if (
    !propertyClaims ||
    propertyClaims.length === 0
  ) {
    return null;
  }


  const claim =
    propertyClaims.find(
      (claim) =>
        claim.rank === "preferred"
    ) ??
    propertyClaims[0];


  return (
    claim?.mainsnak?.datavalue?.value ??
    null
  );
}


async function fetchWikidataObject(
  wikidataId
) {

  const params =
    new URLSearchParams({
      action: "wbgetentities",
      ids: wikidataId,
      props:
        "labels|descriptions|claims",
      languages: "fr|en",
      languagefallback: "1",
      format: "json",
      origin: "*",
    });


  const response =
    await fetchWithRetry(
      `${WIKIDATA_API}?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "GuessTheDate/1.0",
        },
      }
    );


  const data =
    await response.json();


  const entity =
    data.entities?.[wikidataId];


  if (
    !entity ||
    entity.missing !== undefined
  ) {
    throw new Error(
      `Objet Wikidata introuvable : ${wikidataId}`
    );
  }


  // =====================================================
  // NOMS
  // =====================================================

  const frenchName =
    entity.labels?.fr?.value ??
    null;


  const englishName =
    entity.labels?.en?.value ??
    null;


  const name =
    frenchName ??
    englishName ??
    wikidataId;


  // =====================================================
  // DESCRIPTION
  // =====================================================

  const description =
    entity.descriptions?.fr?.value ??
    entity.descriptions?.en?.value ??
    null;


  // =====================================================
  // DATE WIKIDATA ÉVENTUELLE
  // =====================================================

  const dateValue =
    getClaimValue(
      entity.claims,
      "P571"
    );


  const date =
    dateValue?.time ??
    null;


  // =====================================================
  // IMAGE P18
  // =====================================================

  const imageFilename =
    getClaimValue(
      entity.claims,
      "P18"
    );


  let image = null;


  if (imageFilename) {

    image =
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
      encodeURIComponent(
        imageFilename
      );

  }


  return {
    externalId: wikidataId,

    name,

    frenchName,

    englishName,

    description,

    date,

    image,
  };
}


module.exports = {
  fetchWikidataObject,
};


// =========================================================
// TEMP TEST
// =========================================================

async function test() {

  try {

    const object =
      await fetchWikidataObject(
        "Q11442"
      );


    console.log(object);

  } catch (error) {

    console.error(
      error.message
    );

  }
}


if (require.main === module) {
  test();
}