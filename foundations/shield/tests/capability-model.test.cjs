'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve, relative } = require('node:path');
const { normalizeEol, renderCatalog } = require('../scripts/render-capability-catalog.cjs');

const root = resolve(__dirname, '..');
const modelPath = resolve(root, 'model/security-capabilities.json');
const model = JSON.parse(readFileSync(modelPath, 'utf8'));
const capabilitySchema = JSON.parse(readFileSync(resolve(root, 'schemas/security-capability.schema.json'), 'utf8'));
const controlSchema = JSON.parse(readFileSync(resolve(root, 'schemas/security-control.schema.json'), 'utf8'));
const evidenceSchema = JSON.parse(readFileSync(resolve(root, 'schemas/evidence-item.schema.json'), 'utf8'));
const exceptionSchema = JSON.parse(readFileSync(resolve(root, 'schemas/security-exception.schema.json'), 'utf8'));

const expectedGroups = ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER_ASSURE'];
const expectedStatuses = ['PLANNED', 'FOUNDATION', 'PARTIAL', 'IMPLEMENTED', 'VERIFIED'];
const expectedActions = ['ROADMAP', 'GOVERNANCE', 'AVAILABLE'];
const expectedAssessments = ['PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED', 'TECHNICALLY_UNAVAILABLE'];
const requiredCapabilities = [
  'security-governance',
  'security-policy-management',
  'common-security-baseline',
  'security-risk-management',
  'security-exceptions',
  'compliance-framework-mapping',
  'asset-scope-awareness',
  'data-security',
  'threat-modeling',
  'attack-surface-management',
  'third-party-security',
  'strong-room',
  'iam',
  'secrets-management',
  'application-security',
  'network-perimeter-security',
  'secure-configuration-hardening',
  'software-supply-chain-security',
  'cicd-deployment-security',
  'logging-monitoring-detection',
  'vulnerability-management',
  'security-testing',
  'incident-response',
  'forensics-evidence-preservation',
  'corrective-actions',
  'security-resilience-recovery',
  'security-controls',
  'evidence-assurance',
  'security-maturity-improvement'
];

function sorted(values) {
  return [...values].sort();
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

test('registry and schemas are valid JSON with the supported schema version', () => {
  assert.equal(model.schemaVersion, '1.0.0');
  assert.equal(capabilitySchema.properties.schemaVersion.const, model.schemaVersion);
  for (const schema of [capabilitySchema, controlSchema, evidenceSchema, exceptionSchema]) {
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.type, 'object');
    assert.equal(schema.additionalProperties, false);
  }
});

test('all required capability groups and roadmap phases exist exactly once', () => {
  assert.deepEqual(sorted(model.groups.map(group => group.id)), sorted(expectedGroups));
  unique(model.groups.map(group => group.id), 'group IDs');
  assert.deepEqual(sorted(model.roadmapPhases.map(phase => phase.id)), [1, 2, 3, 4, 5, 6]);
  unique(model.roadmapPhases.map(phase => phase.id), 'roadmap phase IDs');
  for (const phase of model.roadmapPhases) {
    assert.ok(phase.name);
    assert.ok(Array.isArray(phase.outcomes) && phase.outcomes.length > 0);
  }
});

test('the complete required capability catalogue is represented with unique IDs', () => {
  const ids = model.capabilities.map(capability => capability.id);
  unique(ids, 'capability IDs');
  assert.deepEqual(sorted(ids), sorted(requiredCapabilities));
});

test('every capability has valid data, maturity, actionability, and relationships', () => {
  const ids = new Set(model.capabilities.map(capability => capability.id));
  const phases = new Set(model.roadmapPhases.map(phase => phase.id));
  const groups = new Set(model.groups.map(group => group.id));
  const nonEmptyArrays = [
    'subCapabilities',
    'expectedPolicies',
    'expectedStandards',
    'expectedControls',
    'expectedEvidence',
    'futureAutomation'
  ];

  for (const capability of model.capabilities) {
    assert.match(capability.id, /^[a-z][a-z0-9-]*$/);
    for (const field of ['name', 'purpose', 'scope', 'owner']) assert.ok(capability[field], `${capability.id}.${field}`);
    assert.ok(groups.has(capability.group), `${capability.id} has an unknown group`);
    assert.ok(expectedStatuses.includes(capability.status), `${capability.id} has an invalid status`);
    assert.ok(expectedActions.includes(capability.actionability), `${capability.id} has invalid actionability`);
    assert.ok(phases.has(capability.roadmapPhase), `${capability.id} has an invalid roadmap phase`);
    for (const field of nonEmptyArrays) {
      assert.ok(Array.isArray(capability[field]) && capability[field].length > 0, `${capability.id}.${field}`);
      assert.ok(capability[field].every(value => typeof value === 'string' && value.length > 0));
    }
    assert.ok(Array.isArray(capability.dependencies));
    unique(capability.dependencies, `${capability.id} dependencies`);
    for (const dependency of capability.dependencies) {
      assert.ok(ids.has(dependency), `${capability.id} has unknown dependency ${dependency}`);
      assert.notEqual(dependency, capability.id, `${capability.id} depends on itself`);
    }
  }
});

test('maturity and assessment vocabularies are canonical and aligned across contracts', () => {
  assert.deepEqual(Object.keys(model.statusModel), expectedStatuses);
  assert.deepEqual(Object.keys(model.actionabilityModel), expectedActions);
  assert.deepEqual(Object.keys(model.assessmentStates), expectedAssessments);
  assert.deepEqual(capabilitySchema.properties.capabilities.items.$ref, '#/$defs/capability');
  assert.deepEqual(capabilitySchema.$defs.capability.properties.status.enum, expectedStatuses);
  assert.deepEqual(capabilitySchema.$defs.capability.properties.actionability.enum, expectedActions);
  assert.deepEqual(controlSchema.properties.complianceState.enum, expectedAssessments);
  assert.deepEqual(evidenceSchema.properties.result.enum, expectedAssessments);
  assert.deepEqual(evidenceSchema.properties.claimType.enum, ['DECLARED', 'OBSERVED', 'VERIFIED']);
});

test('current-state labels do not claim unavailable implementation or verification', () => {
  assert.deepEqual(model.capabilities.filter(item => item.status === 'IMPLEMENTED').map(item => item.id), ['strong-room']);
  assert.deepEqual(model.capabilities.filter(item => item.status === 'VERIFIED'), []);
  for (const capability of model.capabilities.filter(item => item.status === 'PLANNED')) {
    assert.equal(capability.actionability, 'ROADMAP', `${capability.id} must remain informational while planned`);
  }
  assert.deepEqual(model.capabilities.filter(item => item.actionability === 'AVAILABLE').map(item => item.id), ['strong-room']);
  assert.match(model.currentState, /only implemented reusable capability/i);
});

test('Strong Room remains represented as the implemented reusable Shield baseline', () => {
  const strongRoom = model.capabilities.find(capability => capability.id === 'strong-room');
  assert.equal(strongRoom.status, 'IMPLEMENTED');
  assert.equal(strongRoom.actionability, 'AVAILABLE');
  assert.match(strongRoom.scope, /Access.*Tunnel.*NGINX.*Docker\/Compose.*health.*logout.*release.*direct-origin.*evidence/i);
  assert.ok(strongRoom.links.includes('../templates/strong-room/README.md'));
  assert.ok(strongRoom.links.includes('../standards/private-app-security-baseline/README.md'));
  assert.ok(existsSync(resolve(root, 'templates/strong-room')));
});

test('technical validation is never represented as production authorization', () => {
  assert.equal(model.productionAuthorization.invariant, 'technical validation != authorization');
  assert.match(model.productionAuthorization.rule, /human approval gate.*immediately before.*production-impacting/i);
  assert.match(model.productionAuthorization.prohibitedInference, /Tests.*CI.*agents.*AI-generated.*never.*authorization/i);
  const deployment = model.capabilities.find(capability => capability.id === 'cicd-deployment-security');
  assert.match(JSON.stringify(deployment), /human production approval/i);
});

test('control, evidence, and exception schemas preserve assurance safety', () => {
  assert.ok(controlSchema.required.includes('validationMethod'));
  assert.ok(controlSchema.required.includes('evidenceRequirements'));
  assert.ok(controlSchema.required.includes('complianceState'));
  assert.match(controlSchema.description, /absent.*never PASS/i);
  assert.ok(evidenceSchema.required.includes('provenance'));
  assert.ok(evidenceSchema.required.includes('generatedAt'));
  assert.match(evidenceSchema.description, /not silently promoted to VERIFIED/i);
  assert.ok(exceptionSchema.required.includes('approver'));
  assert.ok(exceptionSchema.required.includes('expiryDate'));
  assert.ok(exceptionSchema.required.includes('reviewDate'));
  assert.match(exceptionSchema.description, /Permanent.*bypasses are invalid/i);
  assert.ok(!exceptionSchema.properties.status.enum.includes('PERMANENT'));
});

test('all repository links supplied by capabilities resolve', () => {
  for (const capability of model.capabilities) {
    for (const link of capability.links) {
      assert.ok(!/^https?:/.test(link), `${capability.id} should use a repository-relative link`);
      const target = link.split('#')[0];
      assert.ok(existsSync(resolve(dirname(modelPath), target)), `${capability.id} -> ${link}`);
    }
  }
});

test('the human-readable capability catalogue is current and renderable', () => {
  const cataloguePath = resolve(root, 'docs/security-capability-model.md');
  const expected = renderCatalog(model);
  const actual = readFileSync(cataloguePath, 'utf8');
  assert.equal(normalizeEol(actual), normalizeEol(expected), `${relative(root, cataloguePath)} must be regenerated from the canonical registry`);
  for (const group of model.groups) assert.match(actual, new RegExp(`## ${group.name.replace('&', '\\&')}`));
  for (const capability of model.capabilities) assert.ok(actual.includes(`<a id="${capability.id}"></a>`));
});

test('catalogue freshness comparison is independent of LF and CRLF line endings', () => {
  const expected = renderCatalog(model);
  const windowsCheckout = expected.replace(/\n/g, '\r\n');
  assert.equal(normalizeEol(windowsCheckout), normalizeEol(expected));
});

test('model and schemas contain no credential-shaped fixture values', () => {
  const content = [modelPath,
    resolve(root, 'schemas/security-capability.schema.json'),
    resolve(root, 'schemas/security-control.schema.json'),
    resolve(root, 'schemas/evidence-item.schema.json'),
    resolve(root, 'schemas/security-exception.schema.json')
  ].map(path => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(content, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
  assert.doesNotMatch(content, /\bgh[opsu]_[A-Za-z0-9]{30,}\b/);
  assert.doesNotMatch(content, /\bsk-[A-Za-z0-9]{20,}\b/);
  assert.doesNotMatch(content, /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/);
});
