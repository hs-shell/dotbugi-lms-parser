import type { CourseBase } from './types.js';
import { getHref } from './dom.js';
import { removeSquareBrackets } from './stringUtils.js';

// course_label_ec = 커뮤니티(비교과), 클래스 기반 필터링으로 다국어 대응
const COMMUNITY_CLASS = 'course_label_ec';

function parseCourseFromElement(li: Element): CourseBase | null {
  const link = li.querySelector('a.course_link');
  const href = getHref(li, 'a.course_link');
  if (!link || !href) return null;

  const courseId = new URL(href).searchParams.get('id');
  const titleEl = link.querySelector('.course-title');
  const prof = titleEl?.querySelector('p')?.textContent?.trim();
  const rawTitle = titleEl?.querySelector('h1, h2, h3')?.textContent?.replace(/new/i, '').trim();
  const courseTitle = rawTitle ? removeSquareBrackets(rawTitle) : '';

  if (!courseId || !courseTitle || !prof) return null;

  const isCommunity = li.classList.contains(COMMUNITY_CLASS);
  return { courseId, courseTitle, prof, isCommunity };
}

/** 내 강좌 목록 페이지(LMS 메인)에서 수강 과목 목록 파싱 */
export function parseCoursesFromDOM(root: ParentNode): CourseBase[] {
  return Array.from(root.querySelectorAll('.my-course-lists > li')).flatMap((li) => parseCourseFromElement(li) ?? []);
}
