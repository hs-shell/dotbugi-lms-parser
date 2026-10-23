/** 날짜가 현재 시각 이후(마감 전)인지 확인 */
export function isCurrentDateByDate(date: string | null) {
  if (!date || date.length <= 1) return false;
  return new Date() <= parseLmsDate(date);
}

/** LMS 날짜는 KST 기준이라, 오프셋 없이 파싱하면 실행 환경 TZ로 해석되므로 +09:00을 붙인다 */
function parseLmsDate(date: string) {
  const m = date.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?$/);
  return m ? new Date(`${m[1]}T${m[2] ?? '00:00'}+09:00`) : new Date(date);
}
