import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";

const app: Express = express();

const PORT = Number(process.env.PORT) || 5172;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// ✅ Body parsers — must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/health", (req: Request, res: Response) => {
  res.send({
    message: "Health is ok",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
});
