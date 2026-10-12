const {
  OBJECTS_CONFIG,
} = require("../config/objects");

const {
  getLicensedObject,
} = require("./filterLicensedObjects");


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function buildDataset() {
  const dataset = [];

  const objectsToProcess =
    OBJECTS_CONFIG.filter(
      (object) => object.wikidataId
    );


  console.log(
    `\n🚀 ${objectsToProcess.length} objets à traiter\n`
  );


  for (let i = 0; i < objectsToProcess.length; i++) {

    const configObject =
      objectsToProcess[i];


    console.log(
      `\n[${i + 1}/${objectsToProcess.length}] ${configObject.name}`
    );


    const object =
      await getLicensedObject(
        configObject
      );


    if (object) {
      dataset.push(object);
    }


    // Petite pause pour éviter de spammer Wikidata / Commons
    await sleep(2000);
  }


  // =====================================================
  // SUPPRESSION / FUSION DES DOUBLONS
  // =====================================================

  const uniqueObjects = new Map();


  for (const object of dataset) {

    // Premier passage de cet objet
    if (!uniqueObjects.has(object.external_id)) {

      uniqueObjects.set(
        object.external_id,
        object
      );

      continue;
    }


    // Même QID trouvé dans plusieurs thèmes :
    // on fusionne les thèmes
    const existing =
      uniqueObjects.get(
        object.external_id
      );


    existing.themes = [
      ...new Set([
        ...existing.themes,
        ...object.themes,
      ]),
    ];
  }


  return Array.from(
    uniqueObjects.values()
  );
}


// =========================================================
// TEST
// =========================================================

async function test() {
  try {

    const dataset =
      await buildDataset();


    console.log(
      "\n========================"
    );

    console.log(
      `✅ ${dataset.length} objets valides au total`
    );

    console.log(
      "========================\n"
    );


    const fs = require("fs");
    const path = require("path");

    const outputPath = path.join(
      __dirname,
      "dataset-preview.json"
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(dataset, null, 2),
      "utf8"
    );

    console.log(
      `📁 Dataset enregistré dans : ${outputPath}`
    );

  } catch (error) {

    console.error(
      "❌ Erreur :",
      error.message
    );

  }
}


if (require.main === module) {
  test();
}


module.exports = {
  buildDataset,
};