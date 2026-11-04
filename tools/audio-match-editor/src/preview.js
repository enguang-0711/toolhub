export function createAudioFromBuffer(context, buffer) {
  const result = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) result.copyToChannel(buffer.getChannelData(ch), ch);
  return result;
}

export function playBuffer(context, buffer, { start = 0, end = buffer.duration, gain = 1 } = {}) {
  if (!(start >= 0 && end > start && end <= buffer.duration) || !Number.isFinite(gain) || gain < 0 || gain > 4) {
    throw new RangeError('试听区间或音量无效');
  }
  const source = context.createBufferSource();
  const volume = context.createGain();
  source.buffer = buffer;
  volume.gain.value = gain;
  source.connect(volume); volume.connect(context.destination);
  source.start(0, start, end - start);
  return source;
}

export function filterMatches(matches, threshold) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError('阈值须在 0 到 1 之间');
  return matches.map(match => ({ ...match, visible: match.score >= threshold }));
}
