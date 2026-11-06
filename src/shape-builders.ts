/**
 * Shared shape builders: geometry, SVG path parse, deep clone with new ids.
 */

import { v4 as uuidv4 } from 'uuid';

export function createShapeGeometry(x: number, y: number, width: number, height: number) {
  return {
    selrect: {
      x,
      y,
      width,
      height,
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
    },
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    transformInverse: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  };
}

export type PathSegment = {
  command: string;
  params?: Record<string, number>;
};

/** Convert an SVG path `d` string into Penpot path content segments. */
export function pathContentFromSvgD(d: string): PathSegment[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const segments: PathSegment[] = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  const num = () => {
    const v = Number(tokens[i++]);
    if (Number.isNaN(v)) {
      throw new Error(`Invalid path number near "${tokens[i - 1]}"`);
    }
    return v;
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (!/[a-zA-Z]/.test(cmd)) {
      throw new Error(`Expected path command, got "${cmd}"`);
    }
    const lower = cmd.toLowerCase();
    const relative = cmd === lower;

    const takePoint = () => {
      const x = relative ? cx + num() : num();
      const y = relative ? cy + num() : num();
      return { x, y };
    };

    switch (lower) {
      case 'm': {
        const p = takePoint();
        cx = p.x;
        cy = p.y;
        startX = cx;
        startY = cy;
        segments.push({ command: 'move-to', params: { x: cx, y: cy } });
        while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
          const q = takePoint();
          cx = q.x;
          cy = q.y;
          segments.push({ command: 'line-to', params: { x: cx, y: cy } });
        }
        break;
      }
      case 'l': {
        do {
          const p = takePoint();
          cx = p.x;
          cy = p.y;
          segments.push({ command: 'line-to', params: { x: cx, y: cy } });
        } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
        break;
      }
      case 'h': {
        do {
          const x = relative ? cx + num() : num();
          cx = x;
          segments.push({ command: 'line-to', params: { x: cx, y: cy } });
        } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
        break;
      }
      case 'v': {
        do {
          const y = relative ? cy + num() : num();
          cy = y;
          segments.push({ command: 'line-to', params: { x: cx, y: cy } });
        } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
        break;
      }
      case 'c': {
        do {
          const c1 = takePoint();
          const c2 = takePoint();
          const p = takePoint();
          cx = p.x;
          cy = p.y;
          segments.push({
            command: 'curve-to',
            params: {
              c1x: c1.x,
              c1y: c1.y,
              c2x: c2.x,
              c2y: c2.y,
              x: cx,
              y: cy,
            },
          });
        } while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i]));
        break;
      }
      case 'z': {
        segments.push({ command: 'close-path' });
        cx = startX;
        cy = startY;
        break;
      }
      default:
        throw new Error(`Unsupported SVG path command "${cmd}"`);
    }
  }

  return segments;
}

export function boundsFromPathContent(content: PathSegment[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const seg of content) {
    const p = seg.params;
    if (!p) {continue;}
    for (const key of ['x', 'y', 'c1x', 'c1y', 'c2x', 'c2y'] as const) {
      if (p[key] === undefined) {continue;}
      if (key.endsWith('x')) {
        minX = Math.min(minX, p[key]);
        maxX = Math.max(maxX, p[key]);
      } else {
        minY = Math.min(minY, p[key]);
        maxY = Math.max(maxY, p[key]);
      }
    }
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

const ID_KEYS = new Set([
  'id',
  'parentId',
  'frameId',
  'shapeRef',
  'componentId',
  'componentFile',
  'mainInstanceId',
  'mainInstancePage',
]);

/** Deep-clone a shape subtree under objects, remapping every shape id. */
export function cloneShapeTree(
  objects: Record<string, any>,
  rootId: string,
  opts: {
    dx?: number;
    dy?: number;
    parentId?: string;
    frameId?: string;
    asComponentInstance?: { componentId: string; componentFile?: string };
  } = {}
): { rootId: string; shapes: Record<string, any>; order: string[] } {
  const idMap = new Map<string, string>();
  const collect = (id: string) => {
    if (idMap.has(id)) {return;}
    idMap.set(id, uuidv4());
    const shape = objects[id];
    if (!shape) {
      throw new Error(`Shape not found while cloning: ${id}`);
    }
    const children: string[] = shape.shapes || [];
    for (const childId of children) {
      collect(childId);
    }
  };
  collect(rootId);

  const remapValue = (key: string, value: any): any => {
    if (typeof value === 'string' && idMap.has(value) && (ID_KEYS.has(key) || key === 'id')) {
      return idMap.get(value);
    }
    if (Array.isArray(value)) {
      if (key === 'shapes') {
        return value.map((id) => (typeof id === 'string' && idMap.has(id) ? idMap.get(id) : id));
      }
      return value.map((item) => (item && typeof item === 'object' ? remapObject(item) : item));
    }
    if (value && typeof value === 'object') {
      return remapObject(value);
    }
    return value;
  };

  const remapObject = (obj: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = remapValue(k, v);
    }
    return out;
  };

  const dx = opts.dx || 0;
  const dy = opts.dy || 0;
  const shapes: Record<string, any> = {};
  const order: string[] = [];

  for (const [oldId, newId] of idMap) {
    const original = objects[oldId];
    const cloned = remapObject(structuredClone(original));
    cloned.id = newId;
    if (dx || dy) {
      if (typeof cloned.x === 'number') {cloned.x += dx;}
      if (typeof cloned.y === 'number') {cloned.y += dy;}
      if (cloned.selrect) {
        cloned.selrect = {
          ...cloned.selrect,
          x: (cloned.selrect.x || 0) + dx,
          y: (cloned.selrect.y || 0) + dy,
          x1: (cloned.selrect.x1 || 0) + dx,
          y1: (cloned.selrect.y1 || 0) + dy,
          x2: (cloned.selrect.x2 || 0) + dx,
          y2: (cloned.selrect.y2 || 0) + dy,
        };
      }
      if (Array.isArray(cloned.points)) {
        cloned.points = cloned.points.map((p: any) => ({
          x: (p.x || 0) + dx,
          y: (p.y || 0) + dy,
        }));
      }
    }
    if (opts.asComponentInstance) {
      cloned.componentId = opts.asComponentInstance.componentId;
      if (opts.asComponentInstance.componentFile) {
        cloned.componentFile = opts.asComponentInstance.componentFile;
      }
      cloned.shapeRef = oldId;
      delete cloned.mainInstance;
    } else {
      delete cloned.componentId;
      delete cloned.componentFile;
      delete cloned.shapeRef;
      delete cloned.mainInstance;
    }
    shapes[newId] = cloned;
    order.push(newId);
  }

  const newRootId = idMap.get(rootId)!;
  if (opts.parentId) {
    shapes[newRootId].parentId = opts.parentId;
  }
  if (opts.frameId) {
    shapes[newRootId].frameId = opts.frameId;
  }

  return { rootId: newRootId, shapes, order };
}

export function buildAddObjChanges(
  pageId: string,
  shapes: Record<string, any>,
  order: string[],
  rootParentId: string,
  rootFrameId: string,
  rootIndex?: number | null
): any[] {
  return order.map((id, i) => {
    const obj = shapes[id];
    const isRoot = i === 0 || obj.parentId === rootParentId;
    return {
      type: 'add-obj',
      id,
      pageId,
      frameId: obj.frameId || rootFrameId,
      parentId: obj.parentId || rootParentId,
      ...(isRoot && rootIndex !== undefined ? { index: rootIndex } : {}),
      obj,
    };
  });
}
