import assert from 'node:assert/strict';
import {
  buildExportParams,
  decodeTransitVerbose,
  encodeTransitVerbose,
  exportUsesWasm,
  normalizeExportType,
  resolveExportUri,
} from './src/export-protocol.js';

const encoded = encodeTransitVerbose(
  buildExportParams({
    profileId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    fileId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    pageId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    objectId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    type: 'png',
    scale: 1,
    name: 'screens/home/390',
    isWasm: true,
  })
);

const decoded = decodeTransitVerbose(encoded) as {
  cmd: string;
  wait: boolean;
  'profile-id': string;
  'is-wasm': boolean;
  exports: Array<{
    'file-id': string;
    'page-id': string;
    'object-id': string;
    type: string;
    scale: number;
    suffix: string;
    name: string;
  }>;
};

assert.equal(decoded.cmd, 'export-shapes');
assert.equal(decoded.wait, true);
assert.equal(decoded['is-wasm'], true);
assert.equal(decoded['profile-id'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
assert.equal(decoded.exports[0].type, 'png');
assert.equal(decoded.exports[0].suffix, '');
assert.equal(decoded.exports[0].name, 'screens_home_390');
assert.equal(decoded.exports[0]['object-id'], 'dddddddd-dddd-dddd-dddd-dddddddddddd');
assert.ok(encoded.includes('"~:cmd":"~:export-shapes"'));
assert.ok(encoded.includes('"~u'));

assert.equal(normalizeExportType('jpg'), 'jpeg');
assert.equal(normalizeExportType(undefined), 'png');
assert.throws(() => normalizeExportType('gif'));
assert.equal(exportUsesWasm(undefined), true);
assert.equal(exportUsesWasm('  session  '), false);
assert.equal(
  resolveExportUri('https://design.penpot.app/', '/assets/by-id/abc'),
  'https://design.penpot.app/assets/by-id/abc'
);

const errorBody = decodeTransitVerbose(
  '{"~:type":"validation","~:hint":"no valid session","~:explain":"spec failed"}'
) as { type: string; hint: string };
assert.equal(errorBody.hint, 'no valid session');

console.log('export protocol ok');
