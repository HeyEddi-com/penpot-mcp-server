/**
 * Structure tools: group, ungroup, duplicate, move (alias for reparent).
 */

import { v4 as uuidv4 } from 'uuid';
import { PenpotClient } from '../penpot-client.js';
import { buildAddObjChanges, cloneShapeTree, createShapeGeometry } from '../shape-builders.js';
import { getShape, resolveParentContext } from '../layout-helpers.js';

function pageObjects(file: any, pageId: string): Record<string, any> {
  const data = file.data as any;
  const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
  const page = pagesIndex[pageId];
  if (!page?.objects) {
    throw new Error(`Page not found: ${pageId}`);
  }
  return page.objects;
}

export function createStructureTools(penpotClient: PenpotClient) {
  return {
    move_shapes: {
      description:
        'Move one or more shapes under a new parent (board/group) or reorder siblings. Same as reparent_shape for a single id.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Shape ids to move',
          },
          parentId: { type: 'string', description: 'New parent frame or group' },
          index: { type: 'number', description: 'Optional sibling index (0 = first)' },
        },
        required: ['fileId', 'pageId', 'shapeIds', 'parentId'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        shapeIds: string[];
        parentId: string;
        index?: number;
      }) => {
        if (!args.shapeIds?.length) {
          throw new Error('shapeIds must not be empty');
        }
        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const changes: any[] = [
          {
            type: 'mov-objects',
            pageId: args.pageId,
            parentId,
            shapes: args.shapeIds,
            index: args.index !== undefined ? args.index : null,
            ignoreTouched: true,
          },
        ];
        for (const shapeId of args.shapeIds) {
          changes.push({
            type: 'mod-obj',
            id: shapeId,
            pageId: args.pageId,
            operations: [
              { type: 'set', attr: 'parentId', val: parentId },
              { type: 'set', attr: 'frameId', val: frameId },
            ],
          });
        }
        await penpotClient.applyChanges(args.fileId, changes as any);
        return {
          content: [
            {
              type: 'text',
              text: `Moved ${args.shapeIds.length} shape(s) under ${parentId}`,
            },
          ],
        };
      },
    },

    group_shapes: {
      description: 'Group shapes into a new group container.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeIds: { type: 'array', items: { type: 'string' } },
          name: { type: 'string', default: 'Group' },
          parentId: {
            type: 'string',
            description: 'Optional parent; defaults to the first shape parent',
          },
        },
        required: ['fileId', 'pageId', 'shapeIds'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        shapeIds: string[];
        name?: string;
        parentId?: string;
      }) => {
        if (!args.shapeIds?.length) {
          throw new Error('shapeIds must not be empty');
        }
        const file = await penpotClient.getFile(args.fileId);
        const objects = pageObjects(file, args.pageId);
        const first = objects[args.shapeIds[0]];
        if (!first) {
          throw new Error(`Shape not found: ${args.shapeIds[0]}`);
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const id of args.shapeIds) {
          const shape = objects[id];
          if (!shape) {throw new Error(`Shape not found: ${id}`);}
          const x = shape.x ?? shape.selrect?.x ?? 0;
          const y = shape.y ?? shape.selrect?.y ?? 0;
          const w = shape.width ?? shape.selrect?.width ?? 0;
          const h = shape.height ?? shape.selrect?.height ?? 0;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
        }
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const groupId = uuidv4();
        const parentId = args.parentId || first.parentId || first['parent-id'] || args.pageId;
        const frameId = first.frameId || first['frame-id'] || parentId;
        const geometry = createShapeGeometry(minX, minY, width, height);

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: groupId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: groupId,
              type: 'group',
              name: args.name || 'Group',
              x: minX,
              y: minY,
              width,
              height,
              parentId,
              frameId,
              shapes: [],
              ...geometry,
            },
          },
          {
            type: 'mov-objects',
            pageId: args.pageId,
            parentId: groupId,
            shapes: args.shapeIds,
            index: null,
            ignoreTouched: true,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Grouped ${args.shapeIds.length} shapes into ${args.name || 'Group'} (ID: ${groupId})`,
            },
          ],
        };
      },
    },

    ungroup_shapes: {
      description: 'Ungroup a group: move its children to the group parent and delete the group.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          groupId: { type: 'string' },
        },
        required: ['fileId', 'pageId', 'groupId'],
      },
      handler: async (args: { fileId: string; pageId: string; groupId: string }) => {
        const group = await getShape(penpotClient, args.fileId, args.pageId, args.groupId);
        if (group.type !== 'group') {
          throw new Error(`ungroup_shapes requires a group; got ${group.type}`);
        }
        const children: string[] = group.shapes || [];
        const parentId = group.parentId || group['parent-id'];
        const changes: any[] = [];
        if (children.length) {
          changes.push({
            type: 'mov-objects',
            pageId: args.pageId,
            parentId,
            shapes: children,
            index: null,
            ignoreTouched: true,
          });
        }
        changes.push({
          type: 'del-obj',
          id: args.groupId,
          pageId: args.pageId,
        });
        await penpotClient.applyChanges(args.fileId, changes as any);
        return {
          content: [
            {
              type: 'text',
              text: `Ungrouped ${args.groupId}; moved ${children.length} children to ${parentId}`,
            },
          ],
        };
      },
    },

    duplicate_shapes: {
      description:
        'Duplicate shapes (and nested children). Offset with dx/dy. Use to copy a finished phone board instead of rebuilding it.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeIds: { type: 'array', items: { type: 'string' } },
          dx: { type: 'number', description: 'X offset for copies', default: 40 },
          dy: { type: 'number', description: 'Y offset for copies', default: 40 },
          parentId: {
            type: 'string',
            description: 'Optional parent for the copies; defaults to each original parent',
          },
        },
        required: ['fileId', 'pageId', 'shapeIds'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        shapeIds: string[];
        dx?: number;
        dy?: number;
        parentId?: string;
      }) => {
        if (!args.shapeIds?.length) {
          throw new Error('shapeIds must not be empty');
        }
        const file = await penpotClient.getFile(args.fileId);
        const objects = pageObjects(file, args.pageId);
        const dx = args.dx !== undefined ? args.dx : 40;
        const dy = args.dy !== undefined ? args.dy : 40;
        const allChanges: any[] = [];
        const newIds: string[] = [];

        for (const shapeId of args.shapeIds) {
          const original = objects[shapeId];
          if (!original) {throw new Error(`Shape not found: ${shapeId}`);}
          const parentId =
            args.parentId || original.parentId || original['parent-id'] || args.pageId;
          const frameId = original.frameId || original['frame-id'] || parentId;
          const { rootId, shapes, order } = cloneShapeTree(objects, shapeId, {
            dx,
            dy,
            parentId,
            frameId,
          });
          newIds.push(rootId);
          allChanges.push(...buildAddObjChanges(args.pageId, shapes, order, parentId, frameId));
        }

        await penpotClient.applyChanges(args.fileId, allChanges as any);
        return {
          content: [
            {
              type: 'text',
              text: `Duplicated ${args.shapeIds.length} shape(s). New ids: ${newIds.join(', ')}`,
            },
            {
              type: 'text',
              text: JSON.stringify({ newIds }, null, 2),
            },
          ],
        };
      },
    },
  };
}
