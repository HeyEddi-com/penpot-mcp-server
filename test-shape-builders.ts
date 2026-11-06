import assert from 'node:assert/strict';
import {
  boundsFromPathContent,
  cloneShapeTree,
  pathContentFromSvgD,
} from './src/shape-builders.js';

const triangle = pathContentFromSvgD('M0 0 L100 0 L50 80 Z');
assert.equal(triangle[0].command, 'move-to');
assert.equal(triangle[1].command, 'line-to');
assert.equal(triangle.at(-1)?.command, 'close-path');
const bounds = boundsFromPathContent(triangle);
assert.equal(bounds.width, 100);
assert.equal(bounds.height, 80);

const objects: Record<string, any> = {
  root: {
    id: 'root',
    type: 'frame',
    name: 'Phone',
    x: 0,
    y: 0,
    width: 390,
    height: 844,
    parentId: 'page',
    frameId: 'root',
    shapes: ['child'],
  },
  child: {
    id: 'child',
    type: 'text',
    name: 'Title',
    x: 16,
    y: 24,
    width: 100,
    height: 20,
    parentId: 'root',
    frameId: 'root',
    shapes: [],
  },
};

const cloned = cloneShapeTree(objects, 'root', {
  dx: 400,
  dy: 0,
  parentId: 'page',
  frameId: 'page',
});
assert.notEqual(cloned.rootId, 'root');
assert.equal(cloned.shapes[cloned.rootId].x, 400);
assert.equal(Object.keys(cloned.shapes).length, 2);
const childCopy = Object.values(cloned.shapes).find((s: any) => s.type === 'text') as any;
assert.equal(childCopy.x, 416);
assert.equal(childCopy.parentId, cloned.rootId);

console.log('test-shape-builders: ok');
