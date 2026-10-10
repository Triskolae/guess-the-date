const express = require("express");
const multer = require("multer");
const { uploadToR2 } = require("../services/r2.service");

const router = express.Router();

// Stockage en mémoire vive pour intercepter le buffer avant envoi sur R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5Mo
});

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni." });
    }

    // Nom unique pour éviter les collisions
    const fileKey = `objects/${Date.now()}-${req.file.originalname}`;

    // Upload vers R2
    const imageUrl = await uploadToR2(
      req.file.buffer,
      fileKey,
      req.file.mimetype
    );

    return res.json({
      message: "Image envoyée avec succès !",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Erreur upload R2 :", error);
    return res.status(500).json({ error: "Erreur lors de l'envoi de l'image." });
  }
});

module.exports = router;