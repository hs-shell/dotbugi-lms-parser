/** 대괄호로 감싼 부분([A반] 등) 제거 */
export function removeSquareBrackets(str: string) {
  return str.replace(/\[[^\]]*\]/g, '');
}
