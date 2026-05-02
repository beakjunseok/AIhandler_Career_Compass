import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for CareerNet
  app.get("/api/careernet/majors", async (req, res) => {
    const { search } = req.query;
    const apiKey = process.env.CAREERNET_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "CAREERNET_API_KEY is not configured" });
    }

    try {
      const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${apiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(search as string)}`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("CareerNet API Error:", error);
      res.status(500).json({ error: "Failed to fetch data from CareerNet" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
