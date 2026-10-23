/** 날짜가 현재 시각 이후(마감 전)인지 확인 */
export function isCurrentDateByDate(date: string | null) {
  if (!date || date.length <= 1) return false;
  return new Date() <= new Date(date);
}
