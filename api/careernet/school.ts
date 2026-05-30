import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type SchoolDetail = {
  name: string;
  region?: string;
  type?: string;
  estabType?: string;
  address?: string;
  homepage?: string;
  phone?: string;
  intro?: string;
  majors?: string[];
  _fallback?: boolean;
};

const BASE = "https://www.career.go.kr/cnet/openapi/getOpenApi";

function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function pick(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function isErrorContent(content: any[]): boolean {
  return content.length > 0 && content[0] && content[0].code !== undefined;
}

/** 커리어넷 학교정보(SCHOOL) API에서 대학 기본정보 조회. */
async function fetchCareernetSchool(apiKey: string, name: string): Promise<SchoolDetail | null> {
  const url = `${BASE}?apiKey=${apiKey}&svcType=api&svcCode=SCHOOL&contentType=json&gubun=univ_list&searchSchulNm=${encodeURIComponent(
    name
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  const list = asArray(data?.dataSearch?.content);
  if (isErrorContent(list)) return null;
  if (list.length === 0) return null;

  const hit =
    list.find((it) => pick(it, ["schoolName", "schoolNm"]) === name) ?? list[0];

  return {
    name: pick(hit, ["schoolName", "schoolNm"]) ?? name,
    region: pick(hit, ["region", "adres", "addr"]),
    type: pick(hit, ["schoolType", "schoolGubun"]),
    estabType: pick(hit, ["estType", "estabType", "schoolEstablish"]),
    address: pick(hit, ["adres", "addr", "address"]),
    homepage: pick(hit, ["link", "homepage", "url", "schoolURL"]),
    phone: pick(hit, ["telNo", "tel", "phone"]),
  };
}

async function geminiSchoolFallback(name: string, major?: string): Promise<SchoolDetail | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `대한민국 대학 "${name}"에 대한 사실 기반 요약을 제공하세요. 실제로 존재하는 대학이 아니면 null을 반환.
${major ? `이 학생은 "${major}" 학과에 관심이 있습니다. intro와 majors에 이를 고려.` : ""}
반환 형식: JSON 객체 — name(string), region(string, 예: "서울특별시"), type(string, "대학교(4년제)"/"전문대학"), estabType(string, "국립"/"사립"/"공립"), homepage(string, 공식 홈페이지 URL 또는 ""), intro(string, 2~3문장 소개), majors(string[], 대표 개설 학과 5~8개). 확실하지 않은 필드는 "" 또는 빈 배열.`;
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    if (!result.text) return null;
    const x = JSON.parse(result.text);
    if (!x || typeof x.name !== "string") return null;
    return {
      name: String(x.name),
      region: x.region ? String(x.region) : undefined,
      type: x.type ? String(x.type) : undefined,
      estabType: x.estabType ? String(x.estabType) : undefined,
      homepage: x.homepage ? String(x.homepage) : undefined,
      intro: x.intro ? String(x.intro) : undefined,
      majors: Array.isArray(x.majors) ? x.majors.map((m: any) => String(m)) : undefined,
      _fallback: true,
    };
  } catch (e) {
    console.error("Gemini school fallback failed:", e);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { search, major } = req.query;
  if (!search) {
    return res.status(400).json({ error: "search query is required" });
  }
  const name = String(search);
  const majorStr = major ? String(major) : undefined;
  const apiKey = process.env.CAREERNET_API_KEY;

  let detail: SchoolDetail | null = null;
  let source: "careernet" | "fallback" = "careernet";

  // 1) 커리어넷 대학 정보(SCHOOL) API
  if (apiKey) {
    try {
      detail = await fetchCareernetSchool(apiKey, name);
    } catch (error) {
      console.error("CareerNet SCHOOL API Error:", error);
    }
  }

  // 2) 폴백: 커리어넷 정보가 빈약하면 Gemini로 보강 (커리어넷 구체 필드를 우선)
  if (!detail || (!detail.intro && !detail.homepage && !detail.region)) {
    const fb = await geminiSchoolFallback(name, majorStr);
    if (fb) {
      const cn = detail;
      detail = {
        name: cn?.name || fb.name,
        region: cn?.region || fb.region,
        type: cn?.type || fb.type,
        estabType: cn?.estabType || fb.estabType,
        address: cn?.address || fb.address,
        homepage: cn?.homepage || fb.homepage,
        phone: cn?.phone,
        intro: cn?.intro || fb.intro,
        majors: cn?.majors && cn.majors.length ? cn.majors : fb.majors,
        _fallback: true,
      };
      source = "fallback";
    }
  }

  if (!detail) {
    detail = { name };
  }

  return res.json({ source, school: detail });
}
