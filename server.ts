import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import careernetMajors from "./api/careernet/majors.js";
import careernetSchool from "./api/careernet/school.js";
import recommend from "./api/recommend.js";
import researchTopics from "./api/research-topics.js";
import curriculumUnits from "./api/curriculum-units.js";
import validateInput from "./api/validate-input.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

/**
 * Mount the same serverless handlers used in production (api/*.ts) so local dev
 * (tsx server.ts) and Vercel stay in sync. Express req/res are compatible with
 * the small subset of the Vercel request/response API these handlers use.
 */
const h = (fn: (req: any, res: any) => unknown) => (req: any, res: any) => fn(req, res);

app.get("/api/careernet/majors", h(careernetMajors));
app.get("/api/careernet/school", h(careernetSchool));
app.post("/api/recommend", h(recommend));
app.post("/api/research-topics", h(researchTopics));
app.get("/api/curriculum-units", h(curriculumUnits));
app.post("/api/validate-input", h(validateInput));

// Setup Vite only for local development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const setupLocalServer = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Local dev server running on http://localhost:${PORT}`);
    });
  };
  setupLocalServer();
}

export default app;
