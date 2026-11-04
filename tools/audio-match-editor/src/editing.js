function normalizeClip(clip, sampleRate, channels) {
  if (clip === 'silence') return Array.from({length:channels}, () => new Float32Array(0));
  if (clip?.sampleRate !== sampleRate || !Array.isArray(clip.channels) || clip.channels.length < 1) throw new TypeError('插入音频采样率或声道数据无效');
  const length = clip.channels[0].length;
  if (!length || clip.channels.some(c => c.length !== length)) throw new TypeError('插入音频声道长度无效');
  return Array.from({length:channels}, (_, ch) => clip.channels[Math.min(ch, clip.channels.length - 1)]);
}

function silenceClip(seconds, sampleRate, channels) {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 600) throw new RangeError('静音时长须为 0 到 600 秒');
  const length = Math.round(seconds * sampleRate);
  return Array.from({length:channels}, () => new Float32Array(length));
}

export function applyEdits(audio, edits) {
  const { sampleRate, channels } = audio || {};
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Array.isArray(channels) || !channels.length) throw new TypeError('原始音频数据无效');
  const length = channels[0].length;
  if (!length || channels.some(c => c.length !== length)) throw new TypeError('原始音频声道长度不一致');
  if (!Array.isArray(edits)) throw new TypeError('编辑列表无效');
  const ops = edits.map((edit, index) => {
    const start = Math.round(edit.start * sampleRate), end = Math.round((edit.end ?? edit.start) * sampleRate);
    if (!Number.isFinite(edit.start) || !Number.isFinite(edit.end ?? edit.start) || start < 0 || end < start || end > length) throw new RangeError('编辑区间超出原始音频范围');
    let inserted;
    if (edit.type === 'insert-silence') inserted = silenceClip(edit.duration, sampleRate, channels.length);
    else if (['insert-audio','replace'].includes(edit.type)) inserted = normalizeClip(edit.clip, sampleRate, channels.length);
    else if (edit.type !== 'delete') throw new TypeError(`不支持的编辑类型：${edit.type}`);
    if (edit.type === 'replace' && end === start) throw new RangeError('替换区间不能为空');
    return { ...edit, start, end, inserted, order: index };
  }).sort((a,b) => a.start-b.start || a.order-b.order);

  let consumedUntil = 0;
  for (const op of ops) {
    if (op.start < consumedUntil) throw new RangeError('替换/删除区间重叠，或插入点落在已编辑区间内');
    if ((op.type === 'replace' || op.type === 'delete') && op.end > op.start) consumedUntil = op.end;
  }
  const output = Array.from({length:channels.length}, () => []);
  const appendSource = (from,to) => { for(let ch=0;ch<channels.length;ch++) if(to>from) output[ch].push(channels[ch].subarray(from,to)); };
  const appendClip = clip => { if(clip) for(let ch=0;ch<channels.length;ch++) if(clip[ch].length) output[ch].push(clip[ch]); };
  let cursor=0;
  let insertionPoint=-1;
  for(const op of ops){
    if(op.start>cursor) { appendSource(cursor,op.start); cursor=op.start; insertionPoint=-1; }
    else if(op.start<cursor) throw new RangeError('编辑坐标发生重叠或逆序');
    if(op.type==='insert-silence'||op.type==='insert-audio'){
      if(insertionPoint!==op.start){appendSource(cursor,op.start);insertionPoint=op.start;}
      appendClip(op.inserted);
    }else if(op.type==='replace'){appendClip(op.inserted);cursor=op.end;insertionPoint=-1;}
    else {cursor=op.end;insertionPoint=-1;}
  }
  appendSource(cursor,length);
  const result=output.map(parts=>{ const total=parts.reduce((n,p)=>n+p.length,0); const data=new Float32Array(total); let at=0; for(const p of parts){data.set(p,at);at+=p.length} return data; });
  if(result.some(c=>c.length!==result[0].length)) throw new Error('编辑后声道长度不一致');
  return {sampleRate,channels:result,length:result[0].length,duration:result[0].length/sampleRate};
}

export function edgeEdit(audio, { prependSeconds=0, appendSeconds=0, prependClip=null, appendClip=null }={}) {
  const end=audio.channels[0].length/audio.sampleRate;
  const edits=[];
  if(prependSeconds) edits.push({type:'insert-silence',start:0,duration:prependSeconds});
  if(prependClip) edits.push({type:'insert-audio',start:0,clip:prependClip});
  if(appendClip) edits.push({type:'insert-audio',start:end,clip:appendClip});
  if(appendSeconds) edits.push({type:'insert-silence',start:end,duration:appendSeconds});
  return applyEdits(audio,edits);
}
