import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import routes from "./routes/index.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { connectDB } from "./config/db.ts";

const app: Express = express();

const PORT = Number(process.env.PORT) || 5172;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// ✅ Body parsers — must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
  });
}

start();
