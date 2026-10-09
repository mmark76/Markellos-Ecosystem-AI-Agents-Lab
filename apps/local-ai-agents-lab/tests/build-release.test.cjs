'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {formatBuildId}=require('../scripts/build-release.cjs');
const sha='abcdef0123456789abcdef0123456789abcdef01';

test('EET winter uses Europe/Nicosia (+02:00)',()=>{
  assert.equal(formatBuildId('0.1.1',sha,'2026-01-15T12:00:00Z'),'v0.1.1_20260115_1400_abcdef0');
});
test('EEST summer uses Europe/Nicosia (+03:00)',()=>{
  assert.equal(formatBuildId('1.2.3',sha,'2026-07-15T12:00:00Z'),'v1.2.3_20260715_1500_abcdef0');
});
test('invalid version, SHA, and time are rejected',()=>{
  assert.throws(()=>formatBuildId('1.0.0-beta',sha,'2026-01-15T12:00:00Z'));
  assert.throws(()=>formatBuildId('1.0.0','not-a-git-sha','2026-01-15T12:00:00Z'));
  assert.throws(()=>formatBuildId('1.0.0',sha,'nonsense'));
});
