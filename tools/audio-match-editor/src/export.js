export function encodeWav(audio) {
  const { sampleRate, channels } = audio;
  if (!Number.isInteger(sampleRate) || sampleRate < 1000 || !Array.isArray(channels) || !channels.length) throw new TypeError('导出音频参数无效');
  const length = channels[0].length;
  if (!length || channels.some(c => c.length !== length)) throw new TypeError('导出声道长度无效');
  const bytes = length * channels.length * 2;
  if (!Number.isSafeInteger(bytes) || bytes > 0xffffffff - 36) throw new RangeError('WAV 超过 4 GB 上限');
  const buffer = new ArrayBuffer(44 + bytes), view = new DataView(buffer);
  const text = (offset, value) => { for(let i=0;i<value.length;i++) view.setUint8(offset+i,value.charCodeAt(i)); };
  text(0,'RIFF'); view.setUint32(4,36+bytes,true); text(8,'WAVE'); text(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels.length,true);
  view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*channels.length*2,true);
  view.setUint16(32,channels.length*2,true); view.setUint16(34,16,true); text(36,'data'); view.setUint32(40,bytes,true);
  let offset=44;
  for(let i=0;i<length;i++) for(let ch=0;ch<channels.length;ch++) {
    const x=channels[ch][i]; if(!Number.isFinite(x)) throw new TypeError('音频包含无效采样');
    const clamped=Math.max(-1,Math.min(1,x)); view.setInt16(offset,clamped<0?Math.round(clamped*32768):Math.round(clamped*32767),true); offset+=2;
  }
  return new Blob([buffer],{type:'audio/wav'});
}

export function writeWavToDirectory(directory, name, blob) {
  if (!directory?.getFileHandle || !/^[^\\/:*?"<>|]+\.wav$/i.test(name)) return Promise.reject(new TypeError('输出目录或文件名无效'));
  return (async()=>{
    const handle=await directory.getFileHandle(name,{create:true});
    const stream=await handle.createWritable({keepExistingData:false});
    try { await stream.write(blob); await stream.close(); }
    catch(error) { try { await stream.abort(); } catch {} throw error; }
  })();
}

export function downloadBlob(blob, filename) {
  const safe=String(filename||'audio.wav').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_');
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url; link.download=safe.endsWith('.wav')?safe:`${safe}.wav`; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
