import { defineConfig } from 'vitest/config';

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
