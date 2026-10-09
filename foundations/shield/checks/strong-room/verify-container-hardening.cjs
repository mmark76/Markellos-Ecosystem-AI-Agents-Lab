'use strict';
const { CheckError, requireCondition: check, readContainer, cli } = require('./check-support.cjs');

function verifyHardening(c, expected) {
  const h = c.HostConfig || {};
  const config = c.Config || {};
  check(c.State?.Running === true, 'Container is not running.');
  check(/^[1-9]\d*:[1-9]\d*$/.test(expected.user || ''), 'Expected UID:GID must be numeric and non-root.');
  check(config.User === expected.user, 'Configured user does not match the expected non-root UID:GID.');
  check(/@sha256:[a-f0-9]{64}$/.test(expected.image || ''), 'Expected image must have a reviewed digest.');
  check(config.Image === expected.image, 'Configured image differs from reviewed image.');
  check(h.Privileged === false && h.ReadonlyRootfs === true, 'Privileged or writable-root container.');
  check(h.CapDrop?.map(x => x.toUpperCase()).includes('ALL') && !(h.CapAdd || []).length,
    'Capabilities are not fully dropped or were added back.');
  check(h.SecurityOpt?.some(x => /^no-new-privileges(?::true|=true)?$/.test(x)),
    'No-new-privileges is absent.');
  check(!(h.SecurityOpt || []).some(x => /unconfined/i.test(x)), 'Unconfined security profile.');
  check(!/^(host|container:)/.test(h.NetworkMode || '') &&
    !/^(host|container:)/.test(h.PidMode || '') &&
    !/^(host|container:)/.test(h.IpcMode || ''), 'Shared host/container namespace.');
  check(!(h.Devices || []).length && !(h.DeviceRequests || []).length &&
    !(h.DeviceCgroupRules || []).length && !(h.VolumesFrom || []).length,
    'Unexpected device or inherited volume access.');
  check(h.Memory > 0 && h.PidsLimit > 0 &&
    (h.NanoCpus > 0 || (h.CpuQuota > 0 && h.CpuPeriod > 0)), 'Missing positive resource limits.');
  const networks = Object.keys(c.NetworkSettings?.Networks || {});
  check(networks.length === 1 && networks[0] === expected.network,
    'Container is not attached only to the expected dedicated network.');
  const mounts = c.Mounts || [];
  const approved = {
    '/usr/share/nginx/html': expected.release,
    '/etc/nginx/nginx.conf': expected.nginx
  };
  const binds = mounts.filter(m => m.Type !== 'tmpfs');
  check(binds.length === 2 && new Set(binds.map(m => m.Destination)).size === 2,
    'Unexpected or duplicate persistent mount.');
  for (const mount of binds) {
    check(mount.Type === 'bind' && mount.RW === false &&
      approved[mount.Destination] && mount.Source === approved[mount.Destination],
      'Persistent mount differs from the approved read-only source/target.');
  }
  check(mounts.filter(m => m.Type === 'tmpfs').every(m => m.Destination === '/tmp'),
    'Unexpected tmpfs mount.');
  const temp = h.Tmpfs || {};
  check(Object.keys(temp).length === 1 && typeof temp['/tmp'] === 'string',
    'Expected only a bounded /tmp tmpfs.');
  const options = temp['/tmp'].split(',');
  check(['noexec', 'nosuid', 'nodev'].every(x => options.includes(x)) &&
    options.some(x => /^size=[1-9]\d*[kmg]?$/i.test(x)), 'Missing bounded/hardened tmpfs options.');
  check(c.State.Health?.Status === 'healthy', 'Container health is not healthy.');
  check(config.Labels?.['traefik.enable'] === 'false' &&
    !Object.keys(config.Labels || {}).some(k => /^traefik\.(http|tcp|udp)\./i.test(k)),
    'Proxy exclusion missing or routing labels present.');
  return 'Docker configuration predicates only; process UID/capabilities, image identity, network peers and mount write-denial require separate verification.';
}
if (require.main === module) cli(args => {
  if (args.length !== 8) throw new CheckError('BLOCKED', 'Usage: node verify-container-hardening.cjs DOCKER_CONTEXT CONTAINER_NAME NETWORK_NAME IMAGE_REFERENCE UID:GID RELEASE_PATH NGINX_CONFIG_PATH EXPECTED_IMAGE_ID');
  const c = readContainer(args[0], args[1]);
  check(/^sha256:[a-f0-9]{64}$/.test(args[7]) && c.Image === args[7],
    'Runtime image ID differs from independently resolved reviewed image ID.');
  return verifyHardening(c, { network: args[2], image: args[3], user: args[4], release: args[5], nginx: args[6] });
});
module.exports = { verifyHardening };
