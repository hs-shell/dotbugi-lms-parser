import { defineConfig } from 'vitest/config';

// 개발자 PC(KST)에서도 시간대 버그가 드러나도록 KST가 아닌 TZ로 고정
process.env.TZ = 'UTC';

// 같은 테스트를 브라우저 DOM(jsdom)과 Node DOM(linkedom) 양쪽에서 실행
export default defineConfig({
  test: {
    globals: true,
    projects: [
      { extends: true, test: { name: 'jsdom', environment: 'jsdom' } },
      { extends: true, test: { name: 'linkedom', environment: 'node', setupFiles: ['./test/setup-linkedom.ts'] } },
    ],
  },
});
