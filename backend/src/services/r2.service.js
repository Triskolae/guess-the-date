const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
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
  console.log("Bucket à utiliser :", process.env.R2_BUCKET_NAME);
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

module.exports = {
  uploadToR2,
  deleteFromR2,
};
