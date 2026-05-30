import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Issue = { key: string; reason: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { fields } = req.body ?? {};
  if (!Array.isArray(fields)) {
    return res.status(400).json({ error: "fields array is required" });
  }

  const checkable = fields.filter(
    (f: any) => f && typeof f.value === "string" && f.value.trim().length > 0
  );
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Fail open: if we can't validate, let the user proceed.
  if (!geminiApiKey || checkable.length === 0) {
    return res.json({ ok: true, issues: [] as Issue[] });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `당신은 입력 검증기입니다. 아래 각 항목은 (질문, 학생 답변) 쌍입니다.
학생의 답변이 해당 질문에 대한 "의미 있고 관련 있는" 답변인지 판단하세요.

부적합으로 표시해야 하는 경우:
- 의미 없는 문자열이나 자판 누름 (예: "asdf", "ㅁㄴㅇㄹ", "12345")
- 질문과 전혀 무관한 내용
- 장난, 욕설, 비속어
- 질문을 전혀 이해하지 못한 동문서답

적합으로 간주하는 경우:
- 짧더라도 질문에 관련된 합리적인 답변
- 학생다운 자연스러운 표현

항목 목록:
${JSON.stringify(checkable.map((f: any) => ({ key: f.key, question: f.question, answer: f.value })))}

반환 형식: JSON 객체 { "issues": [ { "key": string, "reason": string } ] }.
- reason은 무엇이 문제이고 어떻게 다시 입력하면 되는지 한국어 한 문장으로.
- 적합한 항목은 issues에 절대 넣지 말 것. 모두 적합하면 issues는 빈 배열.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    if (!result.text) return res.json({ ok: true, issues: [] as Issue[] });
    const parsed = JSON.parse(result.text);
    const issues: Issue[] = Array.isArray(parsed?.issues)
      ? parsed.issues
          .filter((i: any) => i && typeof i.key === "string")
          .map((i: any) => ({
            key: String(i.key),
            reason: String(i.reason ?? "적절한 답변이 아니에요. 다시 입력해주세요."),
          }))
      : [];
    return res.json({ ok: issues.length === 0, issues });
  } catch (error: any) {
    console.error("validate-input Error:", error);
    return res.json({ ok: true, issues: [] as Issue[] });
  }
}
