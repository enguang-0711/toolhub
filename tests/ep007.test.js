import { encodeWav } from '../tools/audio-match-editor/src/export.js';
import { History } from '../tools/audio-match-editor/src/history.js';
import { applyEdits, edgeEdit } from '../tools/audio-match-editor/src/editing.js';
import { matchTemplate } from '../tools/audio-match-editor/src/matcher.js';
import assert from 'node:assert/strict';

// Export format/header, multi-channel sample order, clamping and invalid channels.
const blob=encodeWav({sampleRate:8000,channels:[Float32Array.of(-1,0.5),Float32Array.of(1,-0.5)]});
const bytes=new Uint8Array(await blob.arrayBuffer()), view=new DataView(bytes.buffer);
assert.equal(blob.type,'audio/wav');assert.equal(String.fromCharCode(...bytes.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),8000);assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(40,true),8);assert.equal(view.getInt16(44,true),-32768);assert.equal(view.getInt16(46,true),32767);
assert.throws(()=>encodeWav({sampleRate:8000,channels:[Float32Array.of(NaN)]}),/无效采样/);
const h=new History('original',2);h.push('a');h.push('b');h.push('c');assert.equal(h.items.length,3);assert.equal(h.undo(),'b');assert.equal(h.redo(),'c');h.reset('original');assert.equal(h.canUndo,false);
const original={sampleRate:100,channels:[Float32Array.from({length:100},(_,i)=>i/100)],length:100,duration:1};
const edited=applyEdits(original,[{type:'insert-silence',start:.2,duration:.1},{type:'delete',start:.5,end:.6}]);assert.equal(edited.length,100);
const edge=edgeEdit(original,{prependSeconds:.1,appendSeconds:.2});assert.equal(edge.length,130);
const ref=Float32Array.from({length:64},(_,i)=>Math.sin(i*.31));const target=new Float32Array(300);target.set(ref,111);const result=await matchTemplate(ref,target,{sampleRate:1000,threshold:.85});assert(result.some(m=>Math.abs(m.startSample-111)<16));
console.log('EP-007 tests passed');
