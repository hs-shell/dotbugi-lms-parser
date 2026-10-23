/**
 * LMS 페이지 URL을 받아 파싱된 Document를 돌려주는 함수 (호출 측에서 주입)
 * - 브라우저: fetch(credentials: 'include') + DOMParser
 * - Node: Cookie 헤더(MoodleSession) + linkedom DOMParser
 */
export type FetchHtml = (url: string) => Promise<Document>;

export type CourseBase = {
  courseId: string;
  courseTitle: string;
  prof: string;
  isCommunity?: boolean;
};

export interface VodAttendanceData {
  title: string;
  isAttendance: string;
  weeklyAttendance: string;
  week: number;
  requiredTime?: string;
  watchedTime?: string;
}
