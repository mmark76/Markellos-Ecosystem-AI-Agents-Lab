'use strict';
const { execFileSync } = require('node:child_process');

class CheckError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function requireCondition(ok, message) {
  if (!ok) throw new CheckError('FAIL', message);
}
function readContainer(context, name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(context || '') ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name || '')) {
    throw new CheckError('BLOCKED', 'Supply an explicit Docker context and container name.');
  }
  try {
    // Raw inspect can contain secrets: retain only in memory; never log it.
    const result = JSON.parse(execFileSync('docker',
      ['--context', context, 'container', 'inspect', name],
      { encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
    if (!Array.isArray(result) || result.length !== 1) throw new Error();
    return result[0];
  } catch {
    throw new CheckError('BLOCKED', 'Docker inspection unavailable or invalid; no raw output retained.');
  }
}
function cli(main) {
  try {
    const scope = main(process.argv.slice(2));
    console.log(JSON.stringify({ status: 'PASS', scope }));
  } catch (error) {
    const status = error instanceof CheckError ? error.status : 'BLOCKED';
    const detail = error instanceof CheckError ? error.message : 'Input or filesystem unavailable/invalid; inspect locally without exposing secrets.';
    console.log(JSON.stringify({ status, detail }));
    process.exitCode = status === 'FAIL' ? 1 : 2;
  }
}
module.exports = { CheckError, requireCondition, readContainer, cli };
