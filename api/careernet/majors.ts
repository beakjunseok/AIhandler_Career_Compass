import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { search } = req.query;
  const apiKey = process.env.CAREERNET_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "CAREERNET_API_KEY is not configured" });
  }

  if (!search) {
    return res.status(400).json({ error: "search query is required" });
  }

  try {
    const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${apiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(search as string)}`;
    const response = await fetch(url);
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("CareerNet API Error:", error);
    return res.status(500).json({ error: "Failed to fetch data from CareerNet" });
  }
}
