import { PROJECT } from './state.js';

export const ANALYSIS_RATE = 11025;

export function toMonoAtRate(audioBuffer, targetRate = ANALYSIS_RATE) {
  const { numberOfChannels, sampleRate, length } = audioBuffer;
  if (!Number.isInteger(numberOfChannels) || numberOfChannels < 1 || !Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isInteger(length) || length < 1) {
    throw new TypeError('音频缓冲区参数无效');
  }
  if (!Number.isFinite(targetRate) || targetRate <= 0) throw new RangeError('分析采样率无效');
  const mono = new Float32Array(length);
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const channel = audioBuffer.getChannelData(ch);
    if (!channel || channel.length !== length) throw new TypeError('音频声道数据长度不一致');
    for (let i = 0; i < length; i++) mono[i] += channel[i] / numberOfChannels;
  }
  if (sampleRate === targetRate) return { samples: mono, sampleRate: targetRate };
  const outputLength = Math.max(1, Math.round(length * targetRate / sampleRate));
  const result = new Float32Array(outputLength);
  const ratio = sampleRate / targetRate;
  // Box averaging acts as a lightweight anti-alias filter when downsampling.
  for (let j = 0; j < outputLength; j++) {
    const left = j * ratio, right = Math.min(length, (j + 1) * ratio);
    const from = Math.floor(left), to = Math.max(from + 1, Math.ceil(right));
    let sum = 0, count = 0;
    for (let i = from; i < to && i < length; i++) { sum += mono[i]; count++; }
    result[j] = count ? sum / count : mono[Math.min(from, length - 1)];
  }
  return { samples: result, sampleRate: targetRate };
}

export async function decodeAudioFile(file, audioContext, { maxSeconds = PROJECT.limits.maxSeconds } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function' || !Number.isFinite(file.size) || file.size <= 0) {
    throw new TypeError('请选择非空音频文件');
  }
  if (!audioContext || typeof audioContext.decodeAudioData !== 'function') throw new TypeError('浏览器音频解码器不可用');
  let decoded;
  try {
    decoded = await audioContext.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error(`无法解码“${file.name || '音频'}”；请尝试 PCM WAV 或浏览器支持的音频格式`);
  }
  if (!decoded || decoded.length < 1 || decoded.duration > maxSeconds) {
    throw new RangeError(`音频时长须大于 0 且不超过 ${maxSeconds} 秒`);
  }
  const analysis = toMonoAtRate(decoded);
  return { file, buffer: decoded, samples: analysis.samples, sampleRate: analysis.sampleRate, duration: decoded.duration };
}
