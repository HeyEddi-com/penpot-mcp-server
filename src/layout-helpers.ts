/**
 * Parent nesting + Flex/Grid layout helpers for Penpot add-obj / mod-obj.
 * Attribute names match Penpot update-file OpenAPI (camelCase).
 * Layout mapping verified against live Penpot (see tvolodi/penpot-mcp integration tests).
 */

import { PenpotClient } from './penpot-client.js';

export type ParentContext = {
  parentId: string;
  frameId: string;
};

export async function getRootFrameId(
  client: PenpotClient,
  fileId: string,
  pageId: string
): Promise<string> {
  const file = await client.getFile(fileId);
  const data = file.data as any;
  const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
  const page = pagesIndex[pageId];
  const objectsIndex = page?.objects || {};

  for (const [id, obj] of Object.entries(objectsIndex) as [string, any][]) {
    if (obj.type === 'frame' && !obj.parentId && !obj['parent-id']) {
      return id;
    }
  }

  // Some files use pageId as the root container
  return pageId;
}

export async function getShape(
  client: PenpotClient,
  fileId: string,
  pageId: string,
  shapeId: string
): Promise<any> {
  const file = await client.getFile(fileId);
  const data = file.data as any;
  const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
  const page = pagesIndex[pageId];
  const shape = page?.objects?.[shapeId];
  if (!shape) {
    throw new Error(`Shape not found: ${shapeId}`);
  }
  return shape;
}

/**
 * Resolve where a new shape should live.
 * - No parentId → page root frame
 * - parent is a frame → nest inside it (frameId = parent)
 * - parent is a group/other → nest under it; frameId = parent's frame
 */
export async function resolveParentContext(
  client: PenpotClient,
  fileId: string,
  pageId: string,
  parentId?: string
): Promise<ParentContext> {
  if (!parentId) {
    const root = await getRootFrameId(client, fileId, pageId);
    return { parentId: root, frameId: root };
  }

  const parent = await getShape(client, fileId, pageId, parentId);
  const parentType = parent.type;
  const parentFrameId = parent.frameId || parent['frame-id'] || parentId;

  if (parentType === 'frame') {
    return { parentId, frameId: parentId };
  }

  return { parentId, frameId: parentFrameId };
}

/** MCP schema props shared by create_* tools for nesting. */
export const parentIdSchemaProp = {
  parentId: {
    type: 'string',
    description:
      'Parent shape ID (board/frame/group). Omit to place on the page root. Required for nesting into a board.',
  },
};

/** MCP schema props for child sizing inside a Flex/Grid parent. */
export const layoutItemSchemaProps = {
  layoutItemHSizing: {
    type: 'string',
    description: 'Child horizontal sizing: "fill" | "fix" | "auto" (Fit Content)',
  },
  layoutItemVSizing: {
    type: 'string',
    description: 'Child vertical sizing: "fill" | "fix" | "auto" (Fit Content)',
  },
  layoutItemAlignSelf: {
    type: 'string',
    description: 'Child align-self: "start" | "center" | "end" | "stretch"',
  },
  layoutItemAbsolute: {
    type: 'boolean',
    description: 'Take child out of flex/grid flow (badge, close icon)',
  },
  layoutItemZIndex: { type: 'number', description: 'Stacking order when overlapping' },
  layoutItemRow: { type: 'number', description: 'Grid cell row (0-based or as Penpot expects)' },
  layoutItemColumn: { type: 'number', description: 'Grid cell column' },
  layoutItemRowSpan: { type: 'number', description: 'Grid row span' },
  layoutItemColumnSpan: { type: 'number', description: 'Grid column span' },
};

/** MCP schema props for Flex/Grid on a frame. */
export const frameLayoutSchemaProps = {
  layout: {
    type: 'string',
    description: 'Enable auto-layout on this frame: "flex" | "grid"',
  },
  layoutFlexDir: {
    type: 'string',
    description: 'Flex direction: "row" | "column" | "row-reverse" | "column-reverse"',
  },
  layoutGridDir: {
    type: 'string',
    description: 'Grid flow direction: "row" | "column"',
  },
  layoutGapRow: { type: 'number', description: 'Row gap in px' },
  layoutGapColumn: { type: 'number', description: 'Column gap in px' },
  layoutWrapType: {
    type: 'string',
    description: 'Flex wrap: "wrap" | "nowrap"',
  },
  layoutPadding: {
    type: 'number',
    description: 'Uniform padding on all sides (px). Overrides per-side if set.',
  },
  layoutPaddingTop: { type: 'number', description: 'Padding top (px)' },
  layoutPaddingRight: { type: 'number', description: 'Padding right (px)' },
  layoutPaddingBottom: { type: 'number', description: 'Padding bottom (px)' },
  layoutPaddingLeft: { type: 'number', description: 'Padding left (px)' },
  layoutJustifyContent: {
    type: 'string',
    description:
      'Justify content: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly" | "stretch"',
  },
  layoutAlignItems: {
    type: 'string',
    description: 'Align items: "start" | "center" | "end" | "stretch"',
  },
  layoutAlignContent: {
    type: 'string',
    description:
      'Align content: "start" | "center" | "end" | "stretch" | "space-between" | "space-around" | "space-evenly"',
  },
  layoutJustifyItems: {
    type: 'string',
    description: 'Grid justify items: "start" | "center" | "end" | "stretch"',
  },
  layoutGridColumns: {
    type: 'string',
    description:
      'JSON array of grid column tracks, e.g. \'[{"type":"fixed","value":260},{"type":"flex","value":1}]\'',
  },
  layoutGridRows: {
    type: 'string',
    description:
      'JSON array of grid row tracks, e.g. \'[{"type":"fixed","value":72},{"type":"flex","value":1}]\'',
  },
};

export function buildLayoutItemAttrs(args: Record<string, any>): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  if (args.layoutItemHSizing) {attrs.layoutItemHSizing = args.layoutItemHSizing;}
  if (args.layoutItemVSizing) {attrs.layoutItemVSizing = args.layoutItemVSizing;}
  if (args.layoutItemAlignSelf) {attrs.layoutItemAlignSelf = args.layoutItemAlignSelf;}
  if (args.layoutItemAbsolute !== undefined) {attrs.layoutItemAbsolute = args.layoutItemAbsolute;}
  if (args.layoutItemZIndex !== undefined) {attrs.layoutItemZIndex = args.layoutItemZIndex;}
  if (args.layoutItemRow !== undefined) {attrs.layoutItemRow = args.layoutItemRow;}
  if (args.layoutItemColumn !== undefined) {attrs.layoutItemColumn = args.layoutItemColumn;}
  if (args.layoutItemRowSpan !== undefined) {attrs.layoutItemRowSpan = args.layoutItemRowSpan;}
  if (args.layoutItemColumnSpan !== undefined) {attrs.layoutItemColumnSpan = args.layoutItemColumnSpan;}
  return attrs;
}

export function buildFrameLayoutAttrs(args: Record<string, any>): Record<string, unknown> {
  if (!args.layout && args.layoutFlexDir === undefined && args.layoutGridDir === undefined) {
    return {};
  }

  const layoutType: 'flex' | 'grid' =
    args.layout === 'grid' || args.layoutGridDir || args.layoutGridColumns || args.layoutGridRows
      ? 'grid'
      : 'flex';

  const p1 =
    args.layoutPadding !== undefined
      ? args.layoutPadding
      : args.layoutPaddingTop !== undefined
        ? args.layoutPaddingTop
        : 0;
  const p2 =
    args.layoutPadding !== undefined
      ? args.layoutPadding
      : args.layoutPaddingRight !== undefined
        ? args.layoutPaddingRight
        : 0;
  const p3 =
    args.layoutPadding !== undefined
      ? args.layoutPadding
      : args.layoutPaddingBottom !== undefined
        ? args.layoutPaddingBottom
        : 0;
  const p4 =
    args.layoutPadding !== undefined
      ? args.layoutPadding
      : args.layoutPaddingLeft !== undefined
        ? args.layoutPaddingLeft
        : 0;

  const attrs: Record<string, unknown> = {
    layout: layoutType,
    layoutGap: {
      rowGap: args.layoutGapRow !== undefined ? args.layoutGapRow : 0,
      columnGap: args.layoutGapColumn !== undefined ? args.layoutGapColumn : 0,
    },
    layoutGapType: 'simple',
    layoutPaddingType: 'simple',
    layoutPadding: { p1, p2, p3, p4 },
    layoutAlignItems: args.layoutAlignItems || 'start',
    layoutJustifyContent: args.layoutJustifyContent || 'start',
  };

  if (args.layoutAlignContent) {attrs.layoutAlignContent = args.layoutAlignContent;}
  if (args.layoutJustifyItems) {attrs.layoutJustifyItems = args.layoutJustifyItems;}

  if (layoutType === 'flex') {
    attrs.layoutFlexDir = args.layoutFlexDir || 'column';
    attrs.layoutWrapType = args.layoutWrapType || 'nowrap';
  } else {
    attrs.layoutGridDir = args.layoutGridDir || 'row';
    attrs.layoutGridColumns = args.layoutGridColumns
      ? JSON.parse(args.layoutGridColumns)
      : [{ type: 'flex', value: 1 }];
    attrs.layoutGridRows = args.layoutGridRows
      ? JSON.parse(args.layoutGridRows)
      : [{ type: 'flex', value: 1 }];
  }

  return attrs;
}

/** Build mod-obj set operations from layout / layout-item args. */
export function layoutModOperations(
  args: Record<string, any>
): Array<{ type: 'set'; attr: string; val: unknown }> {
  const ops: Array<{ type: 'set'; attr: string; val: unknown }> = [];
  const frameAttrs = buildFrameLayoutAttrs(args);
  const itemAttrs = buildLayoutItemAttrs(args);
  for (const [attr, val] of Object.entries({ ...frameAttrs, ...itemAttrs })) {
    ops.push({ type: 'set', attr, val });
  }
  return ops;
}
