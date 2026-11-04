const EPS = 1e-12;

function prepareTemplate(input, tapCount = 128) {
  if (!input?.length) throw new TypeError('参考音频不能为空');
  const stride = Math.max(1, Math.floor(input.length / tapCount));
  const taps = [];
  let mean = 0;
  for (let i = 0; i < input.length; i += stride) {
    const value = input[i];
    if (!Number.isFinite(value)) throw new TypeError('参考音频包含无效样本');
    taps.push({ offset: i, value }); mean += value;
  }
  mean /= taps.length;
  let energy = 0;
  for (const tap of taps) { tap.value -= mean; energy += tap.value * tap.value; }
  return { taps, energy };
}

function scoreWindow(target, template, start) {
  let mean = 0;
  for (const tap of template.taps) mean += target[start + tap.offset];
  mean /= template.taps.length;
  let dot = 0, energy = 0;
  for (const tap of template.taps) {
    const x = target[start + tap.offset] - mean;
    dot += x * tap.value; energy += x * x;
  }
  if (energy <= EPS || template.energy <= EPS) return 0;
  return Math.max(-1, Math.min(1, dot / Math.sqrt(energy * template.energy)));
}

export async function matchTemplate(reference, target, {
  sampleRate = 11025, threshold = 0.75, maxMatches = 100,
  minGapSeconds = 0.05, coarseStep = 8, signal = null,
  onProgress = () => {}, yieldControl = () => new Promise(resolve => setTimeout(resolve, 0)),
} = {}) {
  if (!reference?.length || !target?.length) throw new TypeError('参考和目标音频都必须非空');
  if (reference.length > target.length) return [];
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError('阈值须在 0 到 1 之间');
  if (!Number.isInteger(maxMatches) || maxMatches < 1 || maxMatches > 1000) throw new RangeError('候选数量上限无效');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isInteger(coarseStep) || coarseStep < 1) throw new RangeError('搜索参数无效');
  for (const x of target) if (!Number.isFinite(x)) throw new TypeError('目标音频包含无效样本');
  const template = prepareTemplate(reference);
  if (template.energy <= EPS) return [];
  const last = target.length - reference.length;
  const step = Math.max(coarseStep, Math.ceil(reference.length / 160));
  const total = Math.floor(last / step) + 1;
  const candidates = [];
  let best = { index: 0, score: -1 }, prev = null;
  for (let k = 0, i = 0; i <= last; i += step, k++) {
    if (signal?.aborted) throw new DOMException('扫描已取消', 'AbortError');
    const score = Math.abs(scoreWindow(target, template, i));
    if (score > best.score) best = { index: i, score };
    if (!prev || score >= prev.score) prev = { index: i, score };
    else if (prev.score >= threshold) { candidates.push(prev); prev = { index: i, score }; }
    if (k % 128 === 0) {
      onProgress(Math.min(0.9, k / Math.max(1, total) * 0.9));
      await yieldControl();
    }
  }
  if (prev?.score >= threshold) candidates.push(prev);
  if (best.score >= threshold) candidates.push(best);
  const refined = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const from = Math.max(0, candidate.index - step), to = Math.min(last, candidate.index + step);
    let peak = { index: candidate.index, score: -1, signed: 0 };
    for (let i = from; i <= to; i++) {
      const signed = scoreWindow(target, template, i);
      if (Math.abs(signed) > peak.score) peak = { index: i, score: Math.abs(signed), signed };
    }
    if (peak.score >= threshold && !seen.has(peak.index)) { refined.push(peak); seen.add(peak.index); }
  }
  refined.sort((a,b) => b.score-a.score);
  const gap = Math.max(Math.round(minGapSeconds * sampleRate), reference.length, 1);
  const selected = [];
  for (const item of refined) {
    if (selected.every(other => Math.abs(other.index - item.index) >= gap)) selected.push(item);
    if (selected.length >= maxMatches) break;
  }
  selected.sort((a,b) => a.index-b.index); onProgress(1);
  return selected.map((m,i) => ({ id:`match-${m.index}-${i}`, startSample:m.index, endSample:m.index+reference.length,
    start:m.index/sampleRate, end:(m.index+reference.length)/sampleRate, score:m.score,
    polarity:m.signed < 0 ? -1 : 1, accepted:true }));
}
