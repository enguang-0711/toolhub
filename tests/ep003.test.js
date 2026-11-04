import assert from 'node:assert/strict';
import { matchTemplate } from '../tools/audio-match-editor/src/matcher.js';
const ref=Float32Array.from({length:128},(_,i)=>Math.sin(i*.2)+.3*Math.sin(i*.73));
const target=new Float32Array(1200);target.set(ref,205);target.set(ref,803);
const progress=[];const hits=await matchTemplate(ref,target,{sampleRate:1000,threshold:.9,coarseStep:2,onProgress:p=>progress.push(p)});
assert.equal(hits.length,2);assert(hits.some(h=>Math.abs(h.startSample-205)<=2));assert(hits.some(h=>Math.abs(h.startSample-803)<=2));assert(hits.every(h=>h.score>.98));assert(progress.at(-1)===1);
await assert.rejects(() => matchTemplate(ref,target,{threshold:1.01}), RangeError);
console.log('EP-003 tests passed');
