const {
  OBJECTS_CONFIG,
} = require("../config/objects");


const WIKIDATA_API =
  "https://www.wikidata.org/w/api.php";


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


async function searchWikidata(name, retry = 0) {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "fr",
    uselang: "fr",
    type: "item",
    limit: "5",
    format: "json",
    origin: "*",
  });


  const response = await fetch(
    `${WIKIDATA_API}?${params.toString()}`,
    {
      headers: {
        "User-Agent": "GuessTheDate/1.0",
      },
    }
  );


  // Trop de requêtes
  if (response.status === 429) {

    if (retry >= 3) {
      throw new Error(
        "Wikidata bloque encore les requêtes après 3 essais"
      );
    }

    console.log(
      "⏳ Wikidata limite les requêtes, attente de 5 secondes..."
    );

    await sleep(5000);

    return searchWikidata(
      name,
      retry + 1
    );
  }


  if (!response.ok) {
    throw new Error(
      `Erreur Wikidata : ${response.status}`
    );
  }


  const data = await response.json();

  return data.search ?? [];
}


async function main() {

  // On teste seulement Everyday Life
  const objects = OBJECTS_CONFIG.filter(
    (object) =>
      object.themes.includes("Industry & Engineering")
  );


  for (const object of objects) {

    console.log("\n==============================");
    console.log(`🔎 ${object.name}`);
    console.log("==============================");


    try {

      const results = await searchWikidata(
        object.name
      );


      if (results.length === 0) {
        console.log("❌ Aucun résultat");
      }


      for (const result of results) {

        console.log(
          `${result.id} → ${result.label}`
        );

        if (result.description) {
          console.log(
            `   ${result.description}`
          );
        }

      }

    } catch (error) {

      console.log(
        `⚠️ Erreur : ${error.message}`
      );

    }


    // Petite pause entre chaque objet
    await sleep(1000);
  }

}


main();