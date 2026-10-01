import express, { type Express, type Request, type Response } from "express";

const app: Express = express();

// ✅ Body parsers — must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/health/:category/:id", (req: Request, res: Response) => {
  const { category, id } = req.params;
  res.send({
    category: category,
    id: id,
    message: "Health is ok",
  });
});

app.post("/contact", (req: Request, res: Response) => {
  const { name } = req.body;
  const { id } = req.query;

  res.send({
    data: {
      id,
      name,
    },
    message: "Contact call",
  });
});

app.listen(5172);
