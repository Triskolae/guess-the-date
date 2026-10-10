require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const http = require("http");
const db = require("./src/database/db");
// const { Server } = require("socket.io");

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const onboardingRoutes = require("./src/routes/onboarding.routes");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Support CORS avec autorisation des cookies
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Middleware de logging pour la console
app.use(morgan("dev"));

// Montage des routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/onboarding", onboardingRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const connection = db.client.config.connection;
    const dbHost =
      typeof connection === "string" ? "DATABASE_URL" : connection.host;
    const dbName =
      typeof connection === "string" ? "BDD via URL" : connection.database;

    console.log(`🔌 Connexion BDD à : ${dbHost} / Base: ${dbName}`);

    console.log("🔄 Lancement des migrations Knex...");
    const [batchNo, log] = await db.migrate.latest();

    if (log.length === 0) {
      console.log(
        "✅ Aucune nouvelle migration à exécuter (base déjà à jour).",
      );
    } else {
      console.log(
        `✅ Migrations exécutées avec succès (Batch ${batchNo}) :\n - ${log.join("\n - ")}`,
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution des migrations BDD :", error);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
