import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type UnivItem = {
  schoolName: string;
  schoolType?: string;
  major?: string;
  region?: string;
  campus?: string;
  link?: string;
  _fallback?: boolean;
};

const BASE = "https://www.career.go.kr/cnet/openapi/getOpenApi";

function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function str(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const val = obj?.[k];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number") return String(val);
  }
  return undefined;
}

/** careernet returns an auth/error sentinel as content[0].code; detect it. */
function isErrorContent(content: any[]): boolean {
  return content.length > 0 && content[0] && content[0].code !== undefined;
}

/**
 * Step 1 — 학과 목록 검색. Returns matching majors (majorSeq + 학과명),
 * best matches first (exact, then startsWith, then contains).
 */
async function fetchMajorSeqs(
  apiKey: string,
  search: string
): Promise<{ seq: string; name: string }[]> {
  const url = `${BASE}?apiKey=${apiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(
    search
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  const content = asArray(data?.dataSearch?.content);
  if (isErrorContent(content)) return [];

  const seen = new Set<string>();
  const majors: { seq: string; name: string }[] = [];
  for (const item of content) {
    const seq = str(item, ["majorSeq", "seq"]);
    const name = str(item, ["mClass", "major", "facilName", "lClass"]) ?? search;
    if (!seq || seen.has(seq)) continue;
    seen.add(seq);
    majors.push({ seq, name });
  }

  const norm = (s: string) => s.replace(/\s/g, "");
  const q = norm(search);
  majors.sort((a, b) => {
    const an = norm(a.name);
    const bn = norm(b.name);
    const score = (n: string) => (n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 3);
    return score(an) - score(bn);
  });
  return majors;
}

/**
 * Step 2 — 학과 상세 조회. Extracts the 개설대학(university) array from the
 * major-view payload, tolerating field-name variations.
 */
async function fetchUniversitiesForMajor(
  apiKey: string,
  seq: string,
  fallbackMajor: string
): Promise<UnivItem[]> {
  const url = `${BASE}?apiKey=${apiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_view&majorSeq=${encodeURIComponent(
    seq
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  const content = asArray(data?.dataSearch?.content);
  if (isErrorContent(content)) return [];
  const detail = content[0] ?? {};
  const majorName = str(detail, ["major", "mClass"]) ?? fallbackMajor;

  const rawUnis = asArray(
    detail.university ?? detail.universityList ?? detail.univList ?? detail.schoolList
  );

  return rawUnis
    .map((u: any): UnivItem | null => {
      const schoolName = str(u, ["schoolName", "schoolNm", "univName", "campusName"]);
      if (!schoolName) return null;
      return {
        schoolName,
        region: str(u, ["area", "region", "adres", "addr"]),
        major: str(u, ["majorName", "major", "deptName"]) ?? majorName,
        campus: str(u, ["campusName", "campus"]),
        schoolType: str(u, ["schoolType", "schoolGubun", "estType"]),
        link: str(u, ["link", "schoolURL", "url", "homepage"]),
      };
    })
    .filter((x): x is UnivItem => x !== null);
}

/**
 * Gemini fallback: when 커리어넷 returns nothing (or no key), ask Gemini for a
 * realistic list of Korean universities that offer the given major.
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: "search query is required" });
  }
  const major = String(search);
  const apiKey = process.env.CAREERNET_API_KEY;

  let content: UnivItem[] = [];
  let source: "careernet" | "fallback" = "careernet";

  // 1) 커리어넷: 학과 목록 → 상위 매칭 학과들의 개설대학을 병합
  if (apiKey) {
    try {
      const majors = await fetchMajorSeqs(apiKey, major);
      const top = majors.slice(0, 4);
      const lists = await Promise.all(
        top.map((m) => fetchUniversitiesForMajor(apiKey, m.seq, m.name).catch(() => []))
      );

      const byKey = new Map<string, UnivItem>();
      for (const list of lists) {
        for (const u of list) {
          const key = `${u.schoolName}|${u.campus ?? ""}`;
          if (!byKey.has(key)) byKey.set(key, u);
        }
      }
      content = Array.from(byKey.values()).sort((a, b) =>
        a.schoolName.localeCompare(b.schoolName, "ko")
      );
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

  return res.json({ source, major, dataSearch: { content } });
}
