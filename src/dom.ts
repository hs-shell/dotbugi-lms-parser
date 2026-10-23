import { BASE_LINK } from './links.js';

/** 셀렉터로 요소의 텍스트 추출. 없으면 null */
export function getText(parent: ParentNode, selector: string): string | null {
  return parent.querySelector(selector)?.textContent?.trim() || null;
}

/**
 * 셀렉터로 a 태그의 href를 절대 URL로 추출. 없으면 null
 * 브라우저는 a.href가 문서 URL 기준으로 절대화되지만 linkedom은 속성값을 그대로 주므로
 * 같은 결과를 내도록 LMS 주소 기준으로 직접 절대화한다.
 */
export function getHref(parent: ParentNode, selector: string): string | null {
  const href = parent.querySelector(selector)?.getAttribute('href');
  return href ? (URL.parse(href, BASE_LINK)?.href ?? null) : null;
}
