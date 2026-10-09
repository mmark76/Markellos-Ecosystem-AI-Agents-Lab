'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../scripts/validate-foundations.cjs');

test('sanitized foundation imports retain required implementation and pass the safety gate', () => {
  const result = validate();
  assert.ok(result.checkedFiles > 20);
});
