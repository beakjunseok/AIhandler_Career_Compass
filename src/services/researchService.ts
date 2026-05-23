export interface ResearchSuggestion {
  topic: string;
  linkedSubjects: string[];
  motivation: string;
  activities: string[];
  journalText: string;
}

export interface ResearchInput {
  targetDepartment: string;
  careerGoal: string;
  grade: string;
  interestTopic: string;
}

export async function getResearchTopics(input: ResearchInput): Promise<ResearchSuggestion[]> {
  const response = await fetch("/api/research-topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "응답 파싱 실패" }));
    throw new Error(errorData.error || "탐구 주제를 가져오는 중 오류가 발생했습니다.");
  }

  return await response.json();
}
