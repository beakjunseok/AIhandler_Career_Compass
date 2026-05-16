import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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

// Gemini Recommendation Endpoint
app.post("/api/recommend", async (req, res) => {
  const userInput = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const careerNetApiKey = process.env.CAREERNET_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    // 1. Generate search keywords using Gemini
    const keywordPrompt = `
      학생의 정보를 바탕으로 커리어넷 학과 정보 검색을 위한 핵심 키워드 3개를 뽑아주세요.
      정보: ${userInput.interests}, ${userInput.favoriteSubjects}, ${userInput.careerGoal}, 학년: ${userInput.grade}
      반환 형식: ["키워드1", "키워드2", "키워드3"]
    `;

    const kwResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: keywordPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    if (!kwResult.text) throw new Error("Gemini keyword generation failed");
    const keywords = JSON.parse(kwResult.text);

    // 2. Fetch data from CareerNet API
    let apiData: any[] = [];
    if (careerNetApiKey) {
      const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${careerNetApiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(keywords[0])}`;
      const response = await fetch(url);
      const json = await response.json();
      apiData = json.dataSearch?.content || [];
    }

    // 3. Final recommendation using Gemini
    const finalPrompt = `
      당신은 고등학생을 위한 진로 및 진학 상담 전문가입니다.
      학생의 정보와 실제 학과 데이터를 바탕으로 가장 적합한 대학 학과 5곳을 추천해주세요.
      
      학생 정보:
      - 학년: ${userInput.grade}
      - 취향/관심사: ${userInput.interests}
      - 좋아하는 과목: ${userInput.favoriteSubjects}
      - 장래희망: ${userInput.careerGoal}
      
      참고할 실제 학과 데이터 (커리어넷 검색 결과):
      ${JSON.stringify(apiData.slice(0, 10))}
      
      반환 형식은 JSON 배열이어야 하며 각 객체는 다음 필드를 포함해야 합니다: schoolName, departmentName, description, curriculum(배열), matchReason, careerPaths(배열), gradeSpecificAdvice.
    `;

    const finalResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!finalResult.text) throw new Error("Gemini recommendation failed");
    res.json(JSON.parse(finalResult.text));
  } catch (error: any) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

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



