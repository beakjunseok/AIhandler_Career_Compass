export type FieldSpec = {
  key: string;
  label: string;
  question: string;
  value: string;
  required?: boolean;
  /** allow answers without complete Hangul syllables (e.g. English major names) */
  allowNonKorean?: boolean;
};

/**
 * Local, instant Korean-integrity check. Catches broken/garbage input before
 * we spend an API call: jamo-only strings (ㅁㄴㅇㄹ), single-char mashing
 * (ㅋㅋㅋ / aaaa), and unreadable input. Returns key -> message for offenders.
 */
export function checkKoreanIntegrity(fields: FieldSpec[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (f.value ?? '').trim();
    if (!v) {
      if (f.required) errors[f.key] = '필수 입력 항목이에요.';
      continue;
    }
    if (/^[ㄱ-ㅎㅏ-ㅣ\s]+$/.test(v)) {
      errors[f.key] = '완성된 한글로 입력해주세요. (예: "ㅁㄴㅇㄹ" 같은 입력은 안 돼요)';
      continue;
    }
    const hasHangulSyllable = /[가-힣]/.test(v);
    const hasLetterOrDigit = /[A-Za-z0-9]/.test(v);
    if (!hasHangulSyllable && !(f.allowNonKorean && hasLetterOrDigit)) {
      errors[f.key] = '내용을 알아볼 수 있게 입력해주세요.';
      continue;
    }
    const compact = v.replace(/\s/g, '');
    if (compact.length >= 3 && new Set(compact).size === 1) {
      errors[f.key] = '의미 있는 내용을 입력해주세요.';
      continue;
    }
  }
  return errors;
}

/**
 * Semantic relevance check via Gemini: does each answer actually address its
 * question? Fails open (returns ok) on any network/server error so the app
 * stays usable when the endpoint is unavailable.
 */
export async function validateRelevance(
  fields: { key: string; question: string; value: string }[]
): Promise<{ ok: boolean; issues: { key: string; reason: string }[] }> {
  const checkable = fields.filter((f) => (f.value ?? '').trim().length > 0);
  if (checkable.length === 0) return { ok: true, issues: [] };
  try {
    const res = await fetch('/api/validate-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: checkable }),
    });
    if (!res.ok) return { ok: true, issues: [] };
    const json = await res.json();
    const issues = Array.isArray(json?.issues)
      ? json.issues
          .filter((i: any) => i && typeof i.key === 'string')
          .map((i: any) => ({ key: String(i.key), reason: String(i.reason ?? '적절한 답변이 아니에요. 다시 입력해주세요.') }))
      : [];
    return { ok: issues.length === 0, issues };
  } catch {
    return { ok: true, issues: [] };
  }
}
