export interface Recommendation {
  schoolName: string;
  departmentName: string;
  description: string;
  curriculum: string[];
  matchReason: string;
  careerPaths: string[];
  gradeSpecificAdvice: string;
}

export async function getRecommendations(userInput: {
  interests: string;
  favoriteSubjects: string;
  careerGoal: string;
  grade: string;
}): Promise<Recommendation[]> {
  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userInput),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "추천 정보를 가져오는 중 오류가 발생했습니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
}

