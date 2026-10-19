const {
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

// Configuration du client R2 via S3Client
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload un fichier (buffer) vers Cloudflare R2
 * @param {Buffer} fileBuffer - Le contenu du fichier
 * @param {string} fileName - Le nom du fichier / chemin d'accès dans le bucket
 * @param {string} mimeType - Le type MIME (ex: image/jpeg, image/png)
 * @returns {Promise<string>} L'URL publique de l'image
 */
async function uploadToR2(fileBuffer, fileName, mimeType) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  await upload.done();

  // Retourne l'URL publique de l'image
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}

/**
 * Supprime un fichier de R2
 * @param {string} fileName - Le nom / clé du fichier dans le bucket
 */
async function deleteFromR2(fileName) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
  });

  await s3Client.send(command);
}

/**
 * Récupère tous les objets du bucket R2
 */
async function listObjectsFromR2(options) {
  const { api_name, version } = options;
  // Vérification du format de version
  if (!/^v\d+$/.test(version)) {
    throw new Error("Version invalide");
  }

  const objects = [];
  let continuationToken;

  // Filtre sur le dossier de la version demandée
  const prefix = `game_objects/${api_name}/${version}/objects/`;

  do {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    objects.push(...(response.Contents || []));
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects.map((object) => ({
    key: object.Key,
    url: `${process.env.R2_PUBLIC_URL}/${object.Key}`,
    size: object.Size,
    lastModified: object.LastModified,
  }));
}

module.exports = {
  uploadToR2,
  deleteFromR2,
  listObjectsFromR2,
};
