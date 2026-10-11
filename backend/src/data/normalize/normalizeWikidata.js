function getPeriod(year) {
  if (!Number.isInteger(year)) {
    return null;
  }

  if (year < -3000) {
    return "Prehistory";
  }

  if (year <= 476) {
    return "Antiquity";
  }

  if (year <= 1492) {
    return "Middle Ages";
  }

  if (year <= 1789) {
    return "Modern Era";
  }

  return "Contemporary Era";
}


function normalizeWikidataObject(
  wikidataObject,
  configObject
) {
  if (!wikidataObject) {
    return null;
  }

  if (!configObject) {
    return null;
  }


  const year = configObject.year;

  return {
    external_id: wikidataObject.externalId,

    // On garde le nom choisi dans objects.js
    name: configObject.name,

    year,

    // Calculé automatiquement à partir de notre année
    period: getPeriod(year),

    image: wikidataObject.image,

    themes: configObject.themes,

    source: "Wikidata",

    source_url:
      `https://www.wikidata.org/wiki/${wikidataObject.externalId}`,

    // Temporaire / utile pour vérification
    wikidata_name: wikidataObject.name,
    wikidata_description:
      wikidataObject.description,

    wikidata_date:
      wikidataObject.date,
  };
}


function normalizeWikidataObjects(
  wikidataObjects
) {
  return wikidataObjects
    .map(({ wikidataObject, configObject }) =>
      normalizeWikidataObject(
        wikidataObject,
        configObject
      )
    )
    .filter(Boolean);
}


module.exports = {
  getPeriod,
  normalizeWikidataObject,
  normalizeWikidataObjects,
};