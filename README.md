# @dotbugi/lms-parser

한성대학교 LMS(`https://learn.hansung.ac.kr`)의 VOD·출석·과제·퀴즈 HTML을 파싱하는 라이브러리입니다.
[dotbugi](https://github.com/hs-shell/dotbugi)(크롬 확장)와 dotbugi-mcp(Node MCP 서버)가 같은 파서를 쓰기 위해 분리했습니다.

- 한성대 LMS는 Moodle 3.2 + 코스모스 기반이며, 과제·퀴즈·출석·진도 데이터를 **서버 렌더링 HTML로만** 제공합니다. 그래서 API가 아니라 HTML을 파싱합니다.
- 파서는 HTML을 가져오는 방법을 모릅니다. **`FetchHtml` 함수(`(url) => Promise<Document>`)를 주입**받기 때문에 브라우저와 Node 양쪽에서 쓸 수 있습니다.
- 런타임 의존성이 없습니다.

## 설치

```bash
npm install @dotbugi/lms-parser
```

Node 22 이상, ESM 전용입니다.

## 사용법

### 브라우저 (확장 프로그램 content script 등)

LMS에 로그인한 브라우저 세션의 쿠키를 그대로 씁니다.

```ts
import { scrapeCourseData, type FetchHtml } from '@dotbugi/lms-parser';

const fetchHtml: FetchHtml = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
};

const data = await scrapeCourseData(fetchHtml, '12345');
// { vodAttendanceArray, vodDataArray, assignDataArray, quizDataArray }
```

### Node (linkedom)

Node에는 `DOMParser`가 없으므로 [linkedom](https://github.com/WebReflection/linkedom)을 직접 설치해 씁니다.
세션은 `MoodleSession` 쿠키를 `Cookie` 헤더로 보냅니다.

```bash
npm install linkedom
```

```ts
import { DOMParser } from 'linkedom';
import { BASE_LINK, parseCoursesFromDOM, scrapeCourseData, type FetchHtml } from '@dotbugi/lms-parser';

const moodleSession = process.env.MOODLE_SESSION!;

const fetchHtml: FetchHtml = async (url) => {
  const res = await fetch(url, { headers: { Cookie: `MoodleSession=${moodleSession}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return new DOMParser().parseFromString(await res.text(), 'text/html') as unknown as Document;
};

// 내 강좌 목록 (LMS 메인 페이지)
const courses = parseCoursesFromDOM(await fetchHtml(BASE_LINK));

for (const course of courses) {
  const data = await scrapeCourseData(fetchHtml, course.courseId, { isCommunity: course.isCommunity });
}
```

- 타입 선언이 DOM 타입(`Document`)을 쓰므로 TypeScript 프로젝트는 `tsconfig`의 `lib`에 `"DOM"`을 추가하세요.
- 세션이 만료되면 LMS가 로그인 페이지로 리다이렉트하므로 결과가 빈 배열로 나올 수 있습니다.

## API

| 이름                                                               | 설명                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `scrapeCourseData(fetchHtml, courseId, options?)`                  | 한 강좌의 출석·VOD·과제·퀴즈를 한 번에 조회 (부분 실패 허용, 전부 실패 시 throw) |
| `parseCoursesFromDOM(root)`                                        | 내 강좌 목록 페이지에서 과목 목록 파싱                                           |
| `fetchVodList(fetchHtml, url)`                                     | 강좌 메인(`course/view.php`)에서 VOD 목록                                        |
| `fetchVodAttendance(fetchHtml, url)` / `parseAttendanceTable(doc)` | 온라인 출석부(`user_progress_a.php`)                                             |
| `fetchVodProgress(fetchHtml, url)`                                 | 학습 진도(`user_progress.php`), 커뮤니티 강좌용                                  |
| `fetchAssign(fetchHtml, url)`                                      | 과제 목록                                                                        |
| `fetchQuiz(fetchHtml, url, cachedSubmitMap?)`                      | 퀴즈 목록 + 제출 여부                                                            |
| `BASE_LINK`, `get*PageLink(courseId)`                              | LMS URL                                                                          |
| `NOT_SUBMITTED`, `BULK_APPROVED`, `normalizeLmsDate` 등            | LMS 다국어 키워드·날짜 정규화                                                    |

`scrapeCourseData`의 `options`: `cachedQuizzes`(마감된 퀴즈는 상세 페이지 대신 이 제출 상태 재사용), `isCommunity`, `onError`(개별 요청 실패 로깅용).

## 개발

```bash
npm run build   # 타입 체크 + dist 빌드
npm test        # jsdom · linkedom 두 환경에서 같은 테스트 실행
npm run lint
npm run format
```

## 라이선스

Apache-2.0

## 배포

Release PR을 머지하면 CI가 npm Trusted Publishing(OIDC)으로 **스테이징 배포**한다. 공개하려면 패키지 소유자가 2단계 인증으로 승인한다.

```bash
npm stage list @dotbugi/lms-parser
npm stage approve <stage-id>
```
