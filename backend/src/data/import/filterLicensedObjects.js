const {
  fetchWikidataObject,
} = require("../sources/wikidata");

const {
  normalizeWikidataObject,
} = require("../normalize/normalizeWikidata");

const {
  getCommonsImageInfo,
  findAlternativeLicensedImage,
  isLicenseAllowed,
  isImageFormatAllowed,
} = require("../sources/commons");


async function getLicensedObject(configObject) {
  if (!configObject) {
    return null;
  }


  // Pas de QID Wikidata → on ignore l'objet pour l'instant
  if (!configObject.wikidataId) {
    console.log(
      `⏭️ ${configObject.name} → aucun QID Wikidata`
    );

    return null;
  }


  try {

    // =====================================================
    // 1. Récupération de l'objet précis sur Wikidata
    // =====================================================

    const wikidataObject =
      await fetchWikidataObject(
        configObject.wikidataId
      );


    // =====================================================
    // 2. Normalisation
    // =====================================================

    const normalizedObject =
      normalizeWikidataObject(
        wikidataObject,
        configObject
      );


    if (!normalizedObject) {
      console.log(
        `❌ ${configObject.name} → normalisation impossible`
      );

      return null;
    }


    // =====================================================
    // 3. Vérification de l'image Wikidata
    // =====================================================

    let imageInfo = null;


    if (normalizedObject.image) {

      imageInfo =
        await getCommonsImageInfo(
          normalizedObject.image
        );

    }


    // =====================================================
    // 4. Vérification licence + format
    // =====================================================

    let imageAccepted =
      imageInfo &&
      isLicenseAllowed(imageInfo);

    let needsConversion =
      imageAccepted &&
      !isImageFormatAllowed(imageInfo);

    // =====================================================
    // 5. Fallback Commons
    // =====================================================
    // Si l'image fournie par Wikidata :
    // - n'existe pas
    // - n'est pas CC0 / domaine public
    // - ou n'est pas JPEG / PNG / WebP
    //
    // alors on cherche une autre image sur Commons.

    if (!imageAccepted) {

      if (!normalizedObject.image) {

        console.log(
          `🔄 ${configObject.name} → aucune image Wikidata, recherche Commons`
        );

      } else if (
        imageInfo &&
        !isLicenseAllowed(imageInfo)
      ) {

        console.log(
          `🔄 ${configObject.name} → licence refusée (${imageInfo.license ?? "inconnue"}), recherche Commons`
        );

      } else if (
        imageInfo &&
        !isImageFormatAllowed(imageInfo)
      ) {

        console.log(
          `🔄 ${configObject.name} → format refusé (${imageInfo.mime ?? "inconnu"}), recherche Commons`
        );

      } else {

        console.log(
          `🔄 ${configObject.name} → image Wikidata inutilisable, recherche Commons`
        );

      }


      const commonsSearchTerm =
        configObject.imageSearch ??
        wikidataObject.englishName ??
        wikidataObject.name ??
        configObject.name;

      console.log(
        `🔎 Recherche Commons : "${commonsSearchTerm}"`
      );

      imageInfo =
        await findAlternativeLicensedImage(
          commonsSearchTerm
      );


      if (!imageInfo) {

        console.log(
          `❌ ${configObject.name} → aucune image libre exploitable trouvée`
        );

        return null;

      }


      imageAccepted = true;
    }


    // =====================================================
    // 6. Objet accepté
    // =====================================================

    console.log(
      `✅ ${configObject.name} → ${imageInfo.license} / ${imageInfo.mime}`
    );


    return {
      ...normalizedObject,
      image: imageInfo.originalUrl,
      license: imageInfo.license,
      image_mime: imageInfo.mime,
      needs_conversion: needsConversion,
    };


  } catch (error) {

    console.log(
      `⚠️ ${configObject.name} → ${error.message}`
    );

    return null;

  }
}


module.exports = {
  getLicensedObject,
};


// =========================================================
// TEMP TEST
// =========================================================

async function test() {

  const {
    OBJECTS_CONFIG,
  } = require("../config/objects");


  const object =
    OBJECTS_CONFIG.find(
      (object) =>
        object.name === "Aspirateur"
    );


  if (!object) {
    console.log(
      "❌ Aspirateur introuvable dans objects.js"
    );

    return;
  }


  const result =
    await getLicensedObject(object);


  console.log(
    "\nRésultat final :"
  );

  console.log(result);
}


if (require.main === module) {
  test();
}