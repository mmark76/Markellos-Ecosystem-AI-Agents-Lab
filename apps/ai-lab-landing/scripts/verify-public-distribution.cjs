'use strict';

const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { get } = require('node:https');
const { resolve } = require('node:path');

const manifestPath = resolve(__dirname, '..', 'release-distribution.json');

function currentReleaseFromManifest(path = manifestPath) {
  const distribution = JSON.parse(readFileSync(path, 'utf8'));
  const release = distribution?.releases?.[0];
  if (!release || !/^\d+\.\d+\.\d+$/.test(release.version)) throw new Error('Missing current public release version');
  if (!/^https:\/\/pub-[a-z0-9]+\.r2\.dev\/releases\/v\d+\.\d+\.\d+\/AI-Agents-Lab-Windows\.zip$/.test(release.url)) throw new Error('Invalid current public R2 release URL');
  if (!/^[a-f0-9]{64}$/.test(release.sha256)) throw new Error('Invalid current public release SHA-256');
  if (!release.url.includes(`/releases/v${release.version}/`)) throw new Error('Current public release URL/version mismatch');
  return release;
}

function verifyPublicZip(release) {
  return new Promise((resolvePromise, reject) => {
    const request = get(release.url, { headers: { 'user-agent': 'ai-lab-public-distribution-monitor/1.0' } }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Public ZIP returned HTTP ${response.statusCode}`));
        return;
      }
      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      if (!['application/zip', 'application/x-zip-compressed'].some(type => contentType.startsWith(type))) {
        response.resume();
        reject(new Error(`Unexpected public ZIP content type: ${contentType || 'missing'}`));
        return;
      }
      const declaredLength = Number(response.headers['content-length']);
      if (!Number.isSafeInteger(declaredLength) || declaredLength < 1) {
        response.resume();
        reject(new Error('Missing or invalid public ZIP content length'));
        return;
      }
      const hash = createHash('sha256');
      let received = 0;
      response.on('data', chunk => { received += chunk.length; hash.update(chunk); });
      response.on('error', reject);
      response.on('end', () => {
        if (received !== declaredLength) {
          reject(new Error(`Public ZIP length mismatch: expected ${declaredLength}, received ${received}`));
          return;
        }
        const actual = hash.digest('hex');
        if (actual !== release.sha256) {
          reject(new Error(`Public ZIP SHA-256 mismatch: expected ${release.sha256}, received ${actual}`));
          return;
        }
        resolvePromise({ version: release.version, bytes: received, sha256: actual, contentType });
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error('Public ZIP request timed out after 30 seconds')));
    request.on('error', reject);
  });
}

async function main() {
  const release = currentReleaseFromManifest();
  const result = await verifyPublicZip(release);
  console.log(`PUBLIC_DISTRIBUTION_VERIFIED v${result.version} ${result.bytes} ${result.sha256} ${result.contentType}`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

module.exports = { currentReleaseFromManifest, verifyPublicZip };
