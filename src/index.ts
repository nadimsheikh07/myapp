import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import routes from "./routes/index.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { connectDB } from "./config/db.ts";

const app: Express = express();

const PORT = Number(process.env.PORT) || 5172;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// ✅ CORS — must come BEFORE routes and BEFORE body parsers
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // 👈 required so cookies (refresh token) are sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // cache preflight for 24h
  }),
);

// ✅ Body parsers — must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

start();