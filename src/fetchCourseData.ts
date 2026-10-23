import { fetchVodAttendance } from './fetchVodAttendance.js';
import { fetchVodProgress } from './fetchVodProgress.js';
import { fetchVodList } from './fetchVodList.js';
import {
  getAssignPageLink,
  getVodProgressPageLink,
  getIndexPageLink,
  getQuizPageLink,
  getVodPageLink,
} from './links.js';
import { fetchAssign } from './fetchAssign.js';
import { fetchQuiz } from './fetchQuiz.js';
import type { FetchHtml } from './types.js';

export interface ScrapeCourseDataOptions {
  /** 이전에 저장된 퀴즈 목록. 마감된 퀴즈는 상세 페이지 대신 이 제출 상태를 재사용 */
  cachedQuizzes?: { url: string; isSubmit: boolean }[];
  /** 커뮤니티(비교과) 강좌 여부 */
  isCommunity?: boolean;
  /** 개별 요청 실패 시 호출 (부분 실패는 빈 값으로 대체되므로 로깅용) */
  onError?: (reason: unknown) => void;
}

export const scrapeCourseData = async (
  fetchHtml: FetchHtml,
  courseId: string,
  { cachedQuizzes, isCommunity, onError }: ScrapeCourseDataOptions = {}
) => {
  const settled = <T>(result: PromiseSettledResult<T>, fallback: T): T => {
    if (result.status === 'fulfilled') return result.value;
    onError?.(result.reason);
    return fallback;
  };

  // 캐시된 퀴즈의 제출 상태 맵 생성 (url → isSubmit)
  const cachedSubmitMap = cachedQuizzes ? new Map(cachedQuizzes.map((q) => [q.url, q.isSubmit])) : undefined;

  // 일반 강좌: _a.php 우선, 실패 시 .php 폴백
  // 커뮤니티: .php만 사용 (_a.php 접근 불가)
  const progressLink = getVodProgressPageLink(courseId);

  const results = await Promise.allSettled([
    isCommunity ? Promise.resolve(null) : fetchVodAttendance(fetchHtml, getVodPageLink(courseId)),
    fetchVodProgress(fetchHtml, progressLink),
    fetchVodList(fetchHtml, getIndexPageLink(courseId)),
    fetchAssign(fetchHtml, getAssignPageLink(courseId)),
    fetchQuiz(fetchHtml, getQuizPageLink(courseId), cachedSubmitMap, onError),
  ]);

  const vodAttendanceRaw = settled(results[0], null);
  const vodProgress = settled(results[1], []);
  const vodList = settled(results[2], []);
  const assignList = settled(results[3], []);
  const quizList = settled(results[4], []);

  // 모든 요청이 실패하면 에러로 처리
  const allFailed = results.every((r) => r.status === 'rejected');
  if (allFailed) {
    throw new Error('모든 강의 데이터 요청 실패');
  }

  // 일반 강좌: _a.php 데이터 사용 (출석 + 시간 데이터 포함)
  // _a.php 실패 또는 커뮤니티: .php 폴백 (시간 비교 기반 출석 판정)
  const vodAttendance = isCommunity || !vodAttendanceRaw ? vodProgress : vodAttendanceRaw;

  return {
    vodAttendanceArray: vodAttendance,
    vodDataArray: vodList,
    assignDataArray: assignList,
    quizDataArray: quizList,
  };
};
