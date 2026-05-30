import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type UnivItem = {
  schoolName: string;
  schoolType?: string;
  major?: string;
  region?: string;
  link?: string;
  _fallback?: boolean;
};

/**
 * Gemini fallback: when 커리어넷 returns nothing (or no key), ask Gemini for a
 * realistic list of Korean universities that offer the given major.
 * Output is clearly marked with `_fallback: true` so the client can label it.
 */
async function geminiUnivFallback(major: string): Promise<UnivItem[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return [];
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `대한민국에서 "${major}" 또는 매우 유사한 학과를 운영하는 실제 대학을 최대 12곳 알려주세요.
실제로 존재하는 대학만, 추측이면 포함하지 말 것.
반환 형식: JSON 배열. 각 객체 필드 — schoolName(string, 예: "서울대학교"), schoolType(string, "대학교(4년제)" 또는 "전문대학(2~3년제)"), major(string, 그 대학에서의 정확한 학과명), region(string, 예: "서울특별시").`;
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    if (!result.text) return [];
    const parsed = JSON.parse(result.text);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: any) => x && typeof x.schoolName === "string")
      .map((x: any) => ({
        schoolName: String(x.schoolName),
        schoolType: x.schoolType ? String(x.schoolType) : undefined,
        major: x.major ? String(x.major) : major,
        region: x.region ? String(x.region) : undefined,
        _fallback: true,
      }));
  } catch (e) {
    console.error("Gemini univ fallback failed:", e);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: "search query is required" });
  }
  const major = String(search);
  const apiKey = process.env.CAREERNET_API_KEY;

  let content: UnivItem[] = [];
  let source: "careernet" | "fallback" = "careernet";

  // 1) 커리어넷 라이브 API
  if (apiKey) {
    try {
      const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${apiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(major)}`;
      const response = await fetch(url);
      const data = await response.json();
      content = (data?.dataSearch?.content ?? []) as UnivItem[];
    } catch (error) {
      console.error("CareerNet API Error:", error);
    }
  }

  // 2) 폴백: 결과가 없으면 Gemini로 보강
  if (content.length === 0) {
    const fb = await geminiUnivFallback(major);
    if (fb.length > 0) {
      content = fb;
      source = "fallback";
    }
  }

  return res.json({ source, dataSearch: { content } });
}
