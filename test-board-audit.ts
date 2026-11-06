import assert from 'node:assert/strict';
import { auditObjects, coverImageFill, formatAudit } from './src/board-audit.js';

const phone = coverImageFill(390, 844, 2000, 3000);
assert.ok(phone.width >= 390);
assert.ok(phone.height >= 844);
assert.ok(phone.width === 390 || phone.height === 844);

const stretch = coverImageFill(390, 844, 2000, 3000, false);
assert.deepEqual(stretch, { width: 390, height: 844 });

const issues = auditObjects({
  screen: {
    id: 'screen',
    type: 'frame',
    name: 'screens/home/390',
    x: 0,
    y: 0,
    width: 390,
    height: 844,
    shapes: ['photo', 'title'],
  },
  photo: {
    id: 'photo',
    type: 'rect',
    name: 'hero',
    parentId: 'screen',
    x: 0,
    y: 0,
    width: 180,
    height: 120,
    fills: [{ fillImage: { id: 'm', width: 180, height: 120, mtype: 'image/jpeg' } }],
  },
  title: {
    id: 'title',
    type: 'text',
    name: 'title',
    parentId: 'screen',
    x: 16,
    y: 40,
    width: 200,
    height: 80,
  },
  empty: {
    id: 'empty',
    type: 'frame',
    name: 'screens/profile/390',
    x: 800,
    y: 0,
    width: 390,
    height: 844,
    shapes: [],
    fills: [{ fillColor: '#0b1020' }],
  },
});

const text = formatAudit(issues);
assert.match(text, /Board check failed/);
assert.match(text, /frame shows around it/);
assert.match(text, /Overlaps/);
assert.match(text, /empty/);
assert.match(text, /mostly empty/);

console.log('board audit ok');
