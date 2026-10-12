require("dotenv").config({ path: "../../../.env" });
const fs = require("fs");
const path = require("path");
const { uploadToR2 } = require("../services/r2.service");

async function test() {
  try {
    const filePath = path.join(__dirname, "avatar.png");
    const fileBuffer = fs.readFileSync(filePath);

    const publicUrl = await uploadToR2(fileBuffer, "tests/avatar.png", "image/png");
    console.log("Upload réussi ! URL de l'image :", publicUrl);
  } catch (err) {
    console.error("Erreur lors de l'upload :", err);
  }
}

test();
