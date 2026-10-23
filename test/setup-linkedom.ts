import { DOMParser } from 'linkedom';

// Node 환경에는 DOMParser가 없으므로 linkedom 구현을 전역에 주입 (dotbugi-mcp와 같은 조건)
globalThis.DOMParser = DOMParser as unknown as typeof globalThis.DOMParser;
