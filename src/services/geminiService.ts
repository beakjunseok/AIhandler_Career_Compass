import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Recommendation {
  schoolName: string;
  departmentName: string;
  description: string;
  curriculum: string[];
  matchReason: string;
  careerPaths: string[];
  gradeSpecificAdvice: string; // New field for grade-specific advice
}

export async function getRecommendations(userInput: {
  interests: string;
  favoriteSubjects: string;
  careerGoal: string;
  grade: string; // New field for grade
}): Promise<Recommendation[]> {
  // 1. Generate search keywords using Gemini
  const keywordPrompt = `
    학생의 정보를 바탕으로 커리어넷 학과 정보 검색을 위한 핵심 키워드 3개를 뽑아주세요.
    정보: ${userInput.interests}, ${userInput.favoriteSubjects}, ${userInput.careerGoal}, 학년: ${userInput.grade}
    반환 형식: ["키워드1", "키워드2", "키워드3"]
  `;

  let keywords: string[] = [];
  try {
    const kwResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: keywordPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    keywords = JSON.parse(kwResponse.text);
  } catch (e) {
    keywords = [userInput.careerGoal];
  }

  // 2. Fetch data from CareerNet API via proxy
  let apiData: any[] = [];
  try {
    const response = await fetch(`/api/careernet/majors?search=${encodeURIComponent(keywords[0])}`);
    const json = await response.json();
    apiData = json.dataSearch?.content || [];
  } catch (error) {
    console.error("API Fetch Error:", error);
  }

  // 3. Final recommendation using Gemini with API data context
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
    
    각 추천 항목에는 다음 정보가 포함되어야 합니다:
    1. 학교명 (실제 한국의 주요 대학 위주)
    2. 학과명
    3. 학과 설명 (어떤 것을 배우는지)
    4. 주요 커리큘럼 (학년별 또는 주요 과목 리스트)
    5. 추천 이유 (학생의 정보와 어떻게 매칭되는지)
    6. 졸업 후 진로 (취업 분야 등)
    7. 학년별 생기부 맞춤 조언 (gradeSpecificAdvice 필드에 상세히 작성)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw new Error("추천 정보를 가져오는 중 오류가 발생했습니다.");
  }
}
