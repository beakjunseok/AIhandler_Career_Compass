import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Unit = { unit: string; subUnits: string[] };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { subject } = req.query;
  if (!subject) {
    return res.status(400).json({ error: "subject query is required" });
  }
  const subjectStr = String(subject);
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.json({ units: [] as Unit[] });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `2022 개정 교육과정 고등학교 과목 "${subjectStr}"의 대단원과 각 대단원에 속한 소단원을 알려주세요.
교육부 고시 제2022-33호(2022 개정 교육과정) 또는 대표 교과서 목차를 기준으로 실제 단원명만 사용하세요. 임의 생성 금지.
대단원은 4~8개, 각 대단원의 소단원은 2~6개 정도.
반환 형식: JSON 배열. 각 객체 필드 — unit(string, 대단원명), subUnits(string[], 소단원명 목록).`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    if (!result.text) return res.json({ units: [] as Unit[] });
    const parsed = JSON.parse(result.text);
    const units: Unit[] = Array.isArray(parsed)
      ? parsed
          .filter((u: any) => u && typeof u.unit === "string")
          .map((u: any) => ({
            unit: String(u.unit),
            subUnits: Array.isArray(u.subUnits) ? u.subUnits.map((s: any) => String(s)) : [],
          }))
      : [];
    return res.json({ units });
  } catch (error: any) {
    console.error("curriculum-units Error:", error);
    return res.json({ units: [] as Unit[] });
  }
}
