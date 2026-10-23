import { describe, it, expect } from 'vitest';
import { fetchQuiz } from '../src/fetchQuiz.js';
import { getQuizPageLink } from '../src/links.js';
import type { FetchHtml } from '../src/types.js';

const LIST_URL = getQuizPageLink('123');
const QUIZ_URL = 'https://learn.hansung.ac.kr/mod/quiz/view.php?id=9';

const fetchWithHref =
  (href: string): FetchHtml =>
  async (url) => {
    const html =
      url === LIST_URL
        ? `<table class="generaltable"><tbody><tr><td class="cell c0">1주차</td>
            <td class="cell c1"><a href="${href}">퀴즈1</a></td><td class="cell c2">-</td></tr></tbody></table>`
        : '';
    return new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
  };

describe('fetchQuiz 링크 절대화', () => {
  it.each(['view.php?id=9', '/mod/quiz/view.php?id=9', QUIZ_URL])('%s → 퀴즈 절대 URL', async (href) => {
    const [quiz] = await fetchQuiz(fetchWithHref(href), LIST_URL);
    expect(quiz.url).toBe(QUIZ_URL);
  });
});
