/**
 * Layout tools: set Flex/Grid on frames, reparent shapes into boards.
 */

import { PenpotClient } from '../penpot-client.js';
import {
  getShape,
  resolveParentContext,
  buildFrameLayoutAttrs,
  buildLayoutItemAttrs,
  frameLayoutSchemaProps,
  layoutItemSchemaProps,
} from '../layout-helpers.js';

export function createLayoutTools(penpotClient: PenpotClient) {
  return {
    set_frame_layout: {
      description:
        'Set Flex or CSS Grid auto-layout on an existing frame (board). Use after create_frame. Children then flow with gap/padding/align instead of absolute coordinates.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Frame shape ID' },
          ...frameLayoutSchemaProps,
        },
        required: ['fileId', 'pageId', 'shapeId', 'layout'],
      },
      handler: async (args: any) => {
        const shape = await getShape(penpotClient, args.fileId, args.pageId, args.shapeId);
        if (shape.type !== 'frame') {
          throw new Error(`set_frame_layout requires a frame; got type=${shape.type}`);
        }

        const attrs = buildFrameLayoutAttrs(args);
        if (!attrs.layout) {
          throw new Error('layout must be "flex" or "grid"');
        }

        const operations = Object.entries(attrs).map(([attr, val]) => ({
          type: 'set' as const,
          attr,
          val,
        }));

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'mod-obj',
            id: args.shapeId,
            pageId: args.pageId,
            operations,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Set ${attrs.layout} layout on frame ${args.shapeId} (${args.layoutFlexDir || args.layoutGridDir || 'default direction'})`,
            },
          ],
        };
      },
    },

    set_layout_item: {
      description:
        'Set layout child sizing on a shape inside a Flex/Grid parent (fill / fix / auto, align-self, grid cell).',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Child shape ID' },
          ...layoutItemSchemaProps,
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: any) => {
        await getShape(penpotClient, args.fileId, args.pageId, args.shapeId);
        const attrs = buildLayoutItemAttrs(args);
        if (Object.keys(attrs).length === 0) {
          throw new Error('Provide at least one layoutItem* property');
        }

        const operations = Object.entries(attrs).map(([attr, val]) => ({
          type: 'set' as const,
          attr,
          val,
        }));

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'mod-obj',
            id: args.shapeId,
            pageId: args.pageId,
            operations,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Updated layout item on ${args.shapeId}: ${Object.keys(attrs).join(', ')}`,
            },
          ],
        };
      },
    },

    reparent_shape: {
      description:
        'Move a shape under a new parent (nest into a board/group). Updates parentId and frameId. Use to attach absolute sketches into a Flex board.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape to move' },
          parentId: {
            type: 'string',
            description: 'New parent frame or group ID',
          },
          index: {
            type: 'number',
            description: 'Optional index among siblings (0 = first)',
          },
        },
        required: ['fileId', 'pageId', 'shapeId', 'parentId'],
      },
      handler: async (args: any) => {
        await getShape(penpotClient, args.fileId, args.pageId, args.shapeId);
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
            shapes: [args.shapeId],
            index: args.index !== undefined ? args.index : null,
            ignoreTouched: true,
          },
          {
            type: 'mod-obj',
            id: args.shapeId,
            pageId: args.pageId,
            operations: [
              { type: 'set', attr: 'parentId', val: parentId },
              { type: 'set', attr: 'frameId', val: frameId },
            ],
          },
        ];

        await penpotClient.applyChanges(args.fileId, changes as any);

        return {
          content: [
            {
              type: 'text',
              text: `Reparented ${args.shapeId} under ${parentId} (frame ${frameId})`,
            },
          ],
        };
      },
    },
  };
}
