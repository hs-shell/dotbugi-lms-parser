import { describe, it, expect, vi } from 'vitest';
import { scrapeCourseData } from '../src/fetchCourseData.js';
import {
  getAssignPageLink,
  getIndexPageLink,
  getQuizPageLink,
  getVodPageLink,
  getVodProgressPageLink,
} from '../src/links.js';
import type { FetchHtml } from '../src/types.js';

const COURSE_ID = '123';
const QUIZ_URL = 'https://learn.hansung.ac.kr/mod/quiz/view.php?id=9';

// URL별 LMS 응답 HTML (실제 페이지 구조를 최소한으로 재현)
const PAGES: Record<string, string> = {
  [getIndexPageLink(COURSE_ID)]: `
    <ul><li id="section-1"><span class="sectionname">1주차</span><ul>
      <li class="modtype_vod"><div class="activityinstance">
        <a href="https://learn.hansung.ac.kr/mod/vod/view.php?id=1"><span class="instancename">강의1<span class="accesshide"> 동영상</span></span></a>
        <span class="text-ubstrap">2024-03-04 00:00:00 ~ 2024-03-10 23:59:59</span>
        <span class="text-info">, 30:00</span>
      </div></li>
      <li class="modtype_vod dimmed"><div class="activityinstance">
        <a href="https://learn.hansung.ac.kr/mod/vod/view.php?id=2"><span class="instancename">숨김</span></a>
        <span class="text-ubstrap">2024-03-04 00:00:00 ~ 2024-03-10 23:59:59</span>
      </div></li>
    </ul></li></ul>`,
  [getVodProgressPageLink(COURSE_ID)]: `
    <table class="user_progress"><tbody>
      <tr><td class="sectiontitle">1</td><td><img src="/theme/vod.png">강의1</td><td>20:00</td><td>25:00</td></tr>
    </tbody></table>`,
  [getAssignPageLink(COURSE_ID)]: `
    <table class="generaltable"><tbody>
      <tr><td class="cell c0">1주차</td><td class="cell c1"><a href="/mod/assign/view.php?id=5">과제1</a></td>
        <td class="cell c2">2024-03-10 23:59</td><td class="cell c3">미제출</td></tr>
      <tr><td class="cell c0"></td><td class="cell c1"><a href="/mod/assign/view.php?id=6">과제2</a></td>
        <td class="cell c2">-</td><td class="cell c3">제출 완료</td></tr>
    </tbody></table>`,
  [getQuizPageLink(COURSE_ID)]: `
    <table class="generaltable"><tbody>
      <tr><td class="cell c0">1주차</td><td class="cell c1"><a href="view.php?id=9">퀴즈1</a></td>
        <td class="cell c2">2099-01-01 00:00</td></tr>
    </tbody></table>`,
  [QUIZ_URL]: `<table class="quizattemptsummary"><tbody><tr><td>1</td></tr></tbody></table>`,
};

const fakeFetchHtml: FetchHtml = async (url) => {
  const html = PAGES[url];
  if (!html) throw new Error(`HTTP 404: ${url}`);
  return new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
};

describe('scrapeCourseData (fetchHtml 주입)', () => {
  it('주입한 fetchHtml로 모든 페이지를 파싱', async () => {
    const onError = vi.fn();
    const data = await scrapeCourseData(fakeFetchHtml, COURSE_ID, { onError });

    expect(data.vodDataArray).toEqual([
      {
        week: 1,
        subject: '1주차',
        title: '강의1',
        url: 'https://learn.hansung.ac.kr/mod/vod/view.php?id=1',
        range: '2024-03-04 00:00:00 ~ 2024-03-10 23:59:59',
        length: ' 30:00',
      },
    ]);
    expect(data.assignDataArray).toEqual([
      {
        subject: '1주차',
        title: '과제1',
        url: 'https://learn.hansung.ac.kr/mod/assign/view.php?id=5',
        dueDate: '2024-03-10 23:59',
        isSubmit: false,
      },
      {
        subject: '1주차',
        title: '과제2',
        url: 'https://learn.hansung.ac.kr/mod/assign/view.php?id=6',
        dueDate: null,
        isSubmit: true,
      },
    ]);
    expect(data.quizDataArray).toEqual([
      { title: '퀴즈1', subject: '1주차', url: QUIZ_URL, dueDate: '2099-01-01 00:00', isSubmit: true },
    ]);
    // 출석부(_a.php) 실패 → 진도(.php) 폴백 + onError 호출
    expect(data.vodAttendanceArray).toEqual([
      {
        title: '강의1',
        isAttendance: 'o',
        weeklyAttendance: 'o',
        week: 1,
        requiredTime: '20:00',
        watchedTime: '25:00',
      },
    ]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(PAGES[getVodPageLink(COURSE_ID)]).toBeUndefined();
  });

  describe('퀴즈 상세 요청 실패', () => {
    const quizDetailFails: FetchHtml = async (url) => {
      if (url === QUIZ_URL) throw new Error('퀴즈 상세 실패');
      return fakeFetchHtml(url);
    };

    it('onError로 알리고 캐시된 제출 상태를 유지', async () => {
      const onError = vi.fn();
      const data = await scrapeCourseData(quizDetailFails, COURSE_ID, {
        onError,
        cachedQuizzes: [{ url: QUIZ_URL, isSubmit: true }],
      });

      expect(data.quizDataArray).toEqual([expect.objectContaining({ url: QUIZ_URL, isSubmit: true })]);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ cause: expect.any(Error) }));
      expect(onError).toHaveBeenCalledTimes(2); // 출석부(_a.php) 실패 + 퀴즈 상세 실패
    });

    it('캐시가 없으면 미제출(false)로 두되 onError로 알림', async () => {
      const onError = vi.fn();
      const data = await scrapeCourseData(quizDetailFails, COURSE_ID, { onError });

      expect(data.quizDataArray).toEqual([expect.objectContaining({ url: QUIZ_URL, isSubmit: false })]);
      expect(onError).toHaveBeenCalledTimes(2);
    });
  });

  it('모든 요청이 실패하면 에러', async () => {
    const failing: FetchHtml = async () => {
      throw new Error('네트워크 오류');
    };
    await expect(scrapeCourseData(failing, COURSE_ID)).rejects.toThrow('모든 강의 데이터 요청 실패');
  });
});
