require('dotenv').config();

const express = require("express");
const morgan = require('morgan');
const cors = require("cors");
const cookieParser = require('cookie-parser');

const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require('./src/routes/auth.routes');

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
app.use(morgan('dev'));

// Montage des routes
app.use('/api/auth', authRoutes);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
