import "dotenv/config";
import express from "express";
import cors from "cors";
import r2Router from "./routes/r2.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/r2", r2Router);

app.listen(PORT, () => {
  console.log(`union-server running on http://localhost:${PORT}`);
});
