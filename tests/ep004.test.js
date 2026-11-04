import assert from 'node:assert/strict';
import { filterMatches, playBuffer } from '../src/preview.js';
const matches=[{score:.9},{score:.4}];assert.deepEqual(filterMatches(matches,.5).map(x=>x.visible),[true,false]);
assert.throws(()=>filterMatches(matches,2),RangeError);
let startArgs, disconnected=false;
const ctx={destination:{},createBufferSource(){return{connect(){},start(...x){startArgs=x}}},createGain(){return{gain:{},connect(){}}}};
const src=playBuffer(ctx,{duration:3},{start:1,end:2,gain:.5});assert(src);assert.deepEqual(startArgs,[0,1,1]);
assert.throws(()=>playBuffer(ctx,{duration:3},{start:-1,end:2}),RangeError);
console.log('EP-004 tests passed');
