export const PROJECT = Object.freeze({
  title: '音频匹配与编辑器',
  version: '1.0.0',
  limits: Object.freeze({ maxSeconds: 600, maxTemplateSeconds: 30, maxExportBytes: 0xffffffff - 36 }),
});

let projectSequence = 0;

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  projectSequence += 1;
  return `project-${Date.now().toString(36)}-${projectSequence.toString(36)}`;
}

export function createProject(file) {
  return {
    id: createId(),
    file,
    sourceBuffer: null,
    currentBuffer: null,
    analysisSamples: null,
    templateSamples: null,
    matches: [],
    edits: [],
    history: [],
    historyIndex: 0,
    status: 'idle',
    error: null,
  };
}

export function validateDuration(seconds, name = '时长') {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > PROJECT.limits.maxSeconds) {
    throw new RangeError(`${name}必须在 0 到 ${PROJECT.limits.maxSeconds} 秒之间`);
  }
  return seconds;
}
