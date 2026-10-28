'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const installer = fs.readFileSync(path.join(__dirname, '..', 'static', 'model-install.js'), 'utf8');

function runInstaller(statuses) {
  const ids = [
    'model-installer', 'model-install-form', 'model-install-name',
    'model-install-submit', 'model-install-status', 'model-install-progress',
  ];
  const elements = Object.fromEntries(ids.map(id => [id, {hidden: true, disabled: false, textContent: ''}]));
  elements['model-install-form'].addEventListener = () => {};
  let statusIndex = 0;
  let refreshCount = 0;
  let poll;

  vm.runInNewContext(installer, {
    document: {getElementById: id => elements[id] || null},
    fetch: async url => {
      assert.equal(url, '/api/models/install/status');
      return {ok: true, json: async () => statuses[Math.min(statusIndex++, statuses.length - 1)]};
    },
    refreshStatus: async () => { refreshCount += 1; },
    setInterval: callback => { poll = callback; },
  }, {filename: 'model-install.js'});

  return {
    elements,
    poll: () => poll(),
    settled: () => new Promise(resolve => setImmediate(resolve)),
    refreshCount: () => refreshCount,
  };
}

test('completed Ollama pull refreshes role model discovery without the retired #model element', async () => {
  const lab = runInstaller([{state: 'completed', model: 'llama3.1:latest', percent: 100}]);
  await lab.settled();

  assert.equal(lab.elements['model-install-status'].textContent,
    'llama3.1:latest installed in Ollama. Ready to use.');
  assert.equal(lab.refreshCount(), 1);
  assert.equal(lab.elements['model-install-submit'].disabled, false);
  assert.equal(lab.elements['model-install-progress'].hidden, true);

  await lab.poll();
  assert.equal(lab.refreshCount(), 1, 'repeated completion polls should not refresh again');
});

test('running-to-completed pull retains progress and refreshes model discovery once', async () => {
  const lab = runInstaller([
    {state: 'running', model: 'llama3.1:latest', status: 'pulling manifest', percent: 40},
    {state: 'completed', model: 'llama3.1:latest', percent: 100},
  ]);
  await lab.settled();

  assert.match(lab.elements['model-install-status'].textContent, /Downloading llama3\.1:latest/);
  assert.equal(lab.elements['model-install-submit'].disabled, true);
  assert.equal(lab.elements['model-install-progress'].hidden, false);

  await lab.poll();
  assert.equal(lab.elements['model-install-status'].textContent,
    'llama3.1:latest installed in Ollama. Ready to use.');
  assert.equal(lab.refreshCount(), 1);
  assert.equal(lab.elements['model-install-submit'].disabled, false);
});
