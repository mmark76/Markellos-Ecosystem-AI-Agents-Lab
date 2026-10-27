'use strict';
// Fetch public GitHub release metadata only after the visitor opens Release archive.
(() => {
  const API = 'https://api.github.com/repos/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases';
  const DOWNLOAD = 'https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/releases/download/';
  const LEGACY_ZIP = 'AI-Agents-Lab-Windows.zip';
  const versionPattern = /^v\d+\.\d+\.\d+$/;
  const digestPattern = /^sha256:[a-f0-9]{64}$/;

  function githubOnlyReleases(releases, r2Versions) {
    if (!Array.isArray(releases)) return [];
    const found = new Set();
    const items = [];
    for (const release of releases) {
      if (!release || release.draft || !versionPattern.test(release.tag_name)) continue;
      const version = release.tag_name.slice(1);
      if (r2Versions.has(version) || found.has(version)) continue;
      const versionedZip = 'AI-Agents-Lab-Windows-' + release.tag_name + '.zip';
      const asset = Array.isArray(release.assets) && release.assets.find(item =>
        (item.name === versionedZip || item.name === LEGACY_ZIP) && item.state === 'uploaded' && digestPattern.test(item.digest));
      if (!asset) continue;
      found.add(version);
      items.push({version, sha256: asset.digest.slice(7), url: DOWNLOAD + release.tag_name + '/' + asset.name});
    }
    return items.sort((a, b) => {
      const x = a.version.split('.').map(Number);
      const y = b.version.split('.').map(Number);
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
    });
  }

  async function readPublishedReleases() {
    const releases = [];
    for (let page = 1; page <= 20; page++) {
      const response = await fetch(API + '?per_page=100&page=' + page, {
        headers: {Accept: 'application/vnd.github+json'},
      });
      if (!response.ok) throw new Error('GitHub API request failed');
      const items = await response.json();
      if (!Array.isArray(items)) throw new Error('Invalid GitHub release response');
      releases.push(...items);
      if (items.length < 100) return releases;
    }
    throw new Error('GitHub release history exceeds supported page limit');
  }

  function releaseRow(release) {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = release.url;
    anchor.textContent = 'v' + release.version;
    anchor.dataset.zipVersion = 'v' + release.version;
    anchor.dataset.zipSha256 = release.sha256;
    li.append(anchor);
    const code = document.createElement('code');
    code.title = 'SHA-256: ' + release.sha256;
    code.textContent = release.sha256.slice(0, 7);
    li.append(code);
    return li;
  }

  function startArchiveRefresh() {
    const archive = document.getElementById('release-archive');
    const list = document.getElementById('github-beta-history');
    const status = document.getElementById('github-beta-status');
    const r2History = document.getElementById('release-history-r2');
    if (!archive || !list || !status || !r2History) return;
    let requested = false;
    archive.addEventListener('toggle', () => {
      if (!archive.open || requested) return;
      requested = true;
      status.textContent = 'Checking published GitHub releases…';
      const r2Versions = new Set(Array.from(
        r2History.querySelectorAll('[data-zip-version]'),
        item => item.dataset.zipVersion.slice(1)
      ));
      readPublishedReleases().then(releases => {
        const beta = githubOnlyReleases(releases, r2Versions);
        if (beta.length < 1) throw new Error('No verified GitHub-only assets found');
        list.replaceChildren(...beta.map(releaseRow));
        status.textContent = beta.length + ' GitHub-only Windows ZIPs · checked when the archive opened.';
      }).catch(() => {
        // Leave the build-time verified snapshot untouched if GitHub is unavailable.
        status.textContent = 'GitHub could not be refreshed. Showing verified BETA snapshot; see All GitHub Releases for full history.';
      });
    });
  }

  if (typeof document !== 'undefined') startArchiveRefresh();
  if (typeof module !== 'undefined') module.exports = {githubOnlyReleases};
})();
