import assert from 'node:assert/strict';
import { createProject, PROJECT, validateDuration } from '../tools/audio-match-editor/src/state.js';

assert.equal(PROJECT.version, '1.0.0');
assert.equal(validateDuration(0), 0);
assert.equal(validateDuration(600), 600);
assert.throws(() => validateDuration(-1), RangeError);
assert.throws(() => validateDuration(Infinity), RangeError);
const project = createProject({ name: 'a.wav' });
assert.equal(project.file.name, 'a.wav');
assert.equal(project.status, 'idle');
assert.deepEqual(project.matches, []);
console.log('EP-001 tests passed');
