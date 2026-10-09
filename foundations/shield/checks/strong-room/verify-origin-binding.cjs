'use strict';
const { CheckError, requireCondition: check, readContainer, cli } = require('./check-support.cjs');

function verifyBinding(container, hostPort, containerPort) {
  for (const port of [hostPort, containerPort]) {
    if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535)
      throw new CheckError('BLOCKED', 'Expected ports must be integers from 1 to 65535.');
  }
  check(container.State?.Running === true, 'Container is not running.');
  check(!/^(host|container:)/.test(container.HostConfig?.NetworkMode || ''),
    'Host/shared network namespace is forbidden in this profile.');
  for (const ports of [container.HostConfig?.PortBindings, container.NetworkSettings?.Ports]) {
    check(ports && typeof ports === 'object', 'Requested/effective bindings are unavailable.');
    const published = Object.entries(ports).filter(([, values]) => Array.isArray(values) && values.length);
    check(published.length === 1 && published[0][0] === String(containerPort) + '/tcp',
      'Expected exactly one published TCP mapping.');
    const bindings = published[0][1];
    check(bindings.length === 1 && bindings[0].HostIp === '127.0.0.1' &&
      bindings[0].HostPort === String(Number(hostPort)), 'Binding is not the exact expected IPv4 loopback endpoint.');
  }
  return 'Requested and effective Docker mapping only; host HTTP, listeners, NAT and external probes still required.';
}
if (require.main === module) cli(args => {
  if (args.length !== 4) throw new CheckError('BLOCKED', 'Usage: node verify-origin-binding.cjs DOCKER_CONTEXT CONTAINER_NAME LOCAL_PORT CONTAINER_PORT');
  return verifyBinding(readContainer(args[0], args[1]), args[2], args[3]);
});
module.exports = { verifyBinding };
