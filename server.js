import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateInventions } from "./ai.js";
import { buildPatentSearch } from "./patent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.join(__dirname, "h.env")
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const {
      idea,
      category = "Any",
      complexity = "Practical",
      language = "English"
    } = req.body || {};

    if (typeof idea !== "string" || idea.trim().length < 8) {
      return res.status(400).json({
        error: "Please enter an idea with at least 8 characters."
      });
    }

    if (idea.length > 1800) {
      return res.status(400).json({
        error: "Idea must be under 1800 characters."
      });
    }

    const inventions = await generateInventions({
      idea: idea.trim(),
      category,
      complexity,
      language
    });

    res.json({ inventions });

  } catch (error) {
    console.error("Gemini error:", error.message);

    res.status(500).json({
      error: "AI request failed. Check your Gemini API settings."
    });
  }
});

app.get("/api/patents", (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 180);

  if (!q) {
    return res.status(400).json({
      error: "Enter an invention name or keyword."
    });
  }

  res.json(buildPatentSearch(q));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`IDEA GENESIS AI running on port ${PORT}`);
});