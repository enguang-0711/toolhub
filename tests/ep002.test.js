import assert from 'node:assert/strict';
import { toMonoAtRate, decodeAudioFile } from '../tools/audio-match-editor/src/audio.js';
const a={numberOfChannels:2,sampleRate:4,length:8,getChannelData:c=>Float32Array.from({length:8},(_,i)=>c?1:-1)};
const mono=toMonoAtRate(a,4);assert.equal(mono.samples.length,8);assert(mono.samples.every(x=>x===0));
assert.equal(toMonoAtRate(a,2).samples.length,4);
assert.throws(()=>toMonoAtRate({...a,length:0}),TypeError);
await assert.rejects(()=>decodeAudioFile({size:0,arrayBuffer:async()=>new ArrayBuffer(0)},{decodeAudioData(){}}),/非空/);
await assert.rejects(()=>decodeAudioFile({name:'bad.wav',size:10,arrayBuffer:async()=>new ArrayBuffer(2)},{decodeAudioData:async()=>{throw Error('bad')}}),/无法解码/);
console.log('EP-002 tests passed');
