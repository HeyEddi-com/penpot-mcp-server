/**
 * Image fills and board geometry checks.
 * Penpot paints a fill image at fillImage width/height from the shape's top-left.
 * A fill smaller than the shape leaves the rest empty (the corner-photo bug).
 */

export function coverImageFill(
  shapeWidth: number,
  shapeHeight: number,
  imageWidth?: number,
  imageHeight?: number,
  keepAspectRatio = true
): { width: number; height: number } {
  if (!(shapeWidth > 0) || !(shapeHeight > 0)) {
    throw new Error('Shape width and height must be greater than 0 to place an image');
  }
  if (!keepAspectRatio) {
    return { width: Math.round(shapeWidth), height: Math.round(shapeHeight) };
  }
  const sourceW = imageWidth && imageWidth > 0 ? imageWidth : shapeWidth;
  const sourceH = imageHeight && imageHeight > 0 ? imageHeight : shapeHeight;
  const scale = Math.max(shapeWidth / sourceW, shapeHeight / sourceH);
  return {
    width: Math.max(1, Math.round(sourceW * scale)),
    height: Math.max(1, Math.round(sourceH * scale)),
  };
}

export interface AuditIssue {
  shapeId: string;
  name: string;
  problem: string;
}

type Obj = Record<string, unknown>;

function read(obj: Obj, camel: string, kebab: string): unknown {
  if (obj[camel] !== undefined && obj[camel] !== null) {
    return obj[camel];
  }
  return obj[kebab];
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

interface Box {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string;
  type: string;
  childIds: string[];
  imageFill?: { width: number; height: number };
}

function asBox(id: string, raw: Obj): Box {
  const selrect = (read(raw, 'selrect', 'selrect') as Obj | undefined) || {};
  const fills = (read(raw, 'fills', 'fills') as Obj[] | undefined) || [];
  let imageFill: { width: number; height: number } | undefined;
  for (const fill of fills) {
    const image = (read(fill, 'fillImage', 'fill-image') as Obj | undefined) || undefined;
    if (image) {
      imageFill = {
        width: num(read(image, 'width', 'width')),
        height: num(read(image, 'height', 'height')),
      };
      break;
    }
  }
  const shapes = read(raw, 'shapes', 'shapes');
  return {
    id,
    name: String(read(raw, 'name', 'name') || id),
    x: num(read(raw, 'x', 'x'), num(selrect.x)),
    y: num(read(raw, 'y', 'y'), num(selrect.y)),
    width: num(read(raw, 'width', 'width'), num(selrect.width)),
    height: num(read(raw, 'height', 'height'), num(selrect.height)),
    parentId: String(read(raw, 'parentId', 'parent-id') || ''),
    type: String(read(raw, 'type', 'type') || ''),
    childIds: Array.isArray(shapes) ? shapes.map(String) : [],
    imageFill,
  };
}

function intersectionArea(a: Box, b: Box): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const w = right - left;
  const h = bottom - top;
  if (w <= 4 || h <= 4) {
    return 0;
  }
  return w * h;
}

export function auditObjects(objects: Record<string, unknown>): AuditIssue[] {
  const boxes = Object.entries(objects)
    .filter(([, value]) => value && typeof value === 'object')
    .map(([id, value]) => asBox(id, value as Obj));
  const byId = new Map(boxes.map((box) => [box.id, box]));
  const issues: AuditIssue[] = [];

  const childrenOf = (parent: Box): Box[] => {
    const fromList: Box[] = [];
    for (const id of parent.childIds) {
      const child = byId.get(id);
      if (child) {
        fromList.push(child);
      }
    }
    if (fromList.length > 0) {
      return fromList;
    }
    return boxes.filter((box) => box.parentId === parent.id);
  };

  for (const box of boxes) {
    if (box.imageFill && box.width > 0 && box.height > 0) {
      const covers = box.imageFill.width + 1 >= box.width && box.imageFill.height + 1 >= box.height;
      if (!covers) {
        issues.push({
          shapeId: box.id,
          name: box.name,
          problem: `Photo fill is ${box.imageFill.width}×${box.imageFill.height} inside a ${box.width}×${box.height} shape, so it sits in the corner and the rest of the shape stays empty. Recreate the image fill so it covers the shape.`,
        });
      }
      const parent = byId.get(box.parentId);
      const parentScreen =
        parent && parent.type === 'frame' && parent.width >= 300 && parent.height >= 500;
      if (
        parentScreen &&
        parent &&
        (box.width < parent.width * 0.9 || box.height < parent.height * 0.9)
      ) {
        issues.push({
          shapeId: box.id,
          name: box.name,
          problem: `Photo is ${box.width}×${box.height} inside screen "${parent.name}" (${parent.width}×${parent.height}), so the frame shows around it. Make the photo fill the screen.`,
        });
      }
    }

    const screen = box.type === 'frame' && box.width >= 300 && box.height >= 500;
    const children = childrenOf(box);
    if (screen && children.length === 0 && !box.imageFill) {
      issues.push({
        shapeId: box.id,
        name: box.name,
        problem: `Screen frame is empty (${box.width}×${box.height}). It is only a colored rectangle.`,
      });
    }

    if (screen && children.length > 0) {
      const covered = children.some(
        (child) => child.width >= box.width * 0.9 && child.height >= box.height * 0.9
      );
      const contentArea = children.reduce((sum, child) => sum + child.width * child.height, 0);
      if (!covered && !box.imageFill && contentArea < box.width * box.height * 0.45) {
        issues.push({
          shapeId: box.id,
          name: box.name,
          problem: `Screen is mostly empty. Children cover under half of ${box.width}×${box.height}. Make the main image or stack fill the frame.`,
        });
      }
    }

    for (let i = 0; i < children.length; i += 1) {
      for (let j = i + 1; j < children.length; j += 1) {
        const a = children[i];
        const b = children[j];
        const area = intersectionArea(a, b);
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        if (smaller > 0 && area / smaller >= 0.25) {
          issues.push({
            shapeId: a.id,
            name: a.name,
            problem: `Overlaps "${b.name}" by ${Math.round((area / smaller) * 100)}% of the smaller shape. Move one, or put them in a flex column with gap instead of stacking absolute boxes.`,
          });
        }
      }
    }
  }

  return issues;
}

export function formatAudit(issues: AuditIssue[]): string {
  if (issues.length === 0) {
    return 'Board check passed. No overlapping siblings, no corner photos, no empty screens.';
  }
  const lines = issues.map(
    (issue, index) => `${index + 1}. ${issue.name} (${issue.shapeId}): ${issue.problem}`
  );
  return `Board check failed (${issues.length}). Fix every line, then run audit_board again.\n${lines.join('\n')}`;
}
