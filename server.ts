import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

      const kwResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: keywordPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const keywords = JSON.parse(kwResponse.text);

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
        
        학년별 맞춤 조언 가이드:
        - 고등학교 1~2학년인 경우: 해당 학과에 합격하기 위해 지금부터 학생부(생기부)의 '세부능력 및 특기사항(세특)', '창체활동' 등에 어떤 구체적인 탐구 주제나 활동 내용을 기록하면 좋을지 로드맵을 제시해주세요.
        - 고등학교 3학년인 경우: 현재까지의 관심사와 활동을 바탕으로, 남은 기간 동안 생기부를 어떻게 마무리하여 해당 학과에 지원하는 것이 유리할지, 그리고 현재 활동이 해당 학과와 어떻게 연결되는지 분석해주세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                schoolName: { type: Type.STRING },
                departmentName: { type: Type.STRING },
                description: { type: Type.STRING },
                curriculum: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                matchReason: { type: Type.STRING },
                careerPaths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                gradeSpecificAdvice: { type: Type.STRING }
              },
              required: ["schoolName", "departmentName", "description", "curriculum", "matchReason", "careerPaths", "gradeSpecificAdvice"]
            }
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Recommendation Error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
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

  // Only listen if not running as a Vercel serverless function
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export default startServer();

