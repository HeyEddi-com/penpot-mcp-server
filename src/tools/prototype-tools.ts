/**
 * Prototypes: interactions, flows, and absolute constraints.
 */

import { v4 as uuidv4 } from 'uuid';
import { PenpotClient } from '../penpot-client.js';
import { getShape } from '../layout-helpers.js';

export function createPrototypeTools(penpotClient: PenpotClient) {
  return {
    set_constraints: {
      description:
        'Set absolute resize constraints on a shape (constraintsH / constraintsV). Used when a child is not in Flex/Grid.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeId: { type: 'string' },
          constraintsH: {
            type: 'string',
            description: '"left" | "right" | "leftright" | "center" | "scale"',
          },
          constraintsV: {
            type: 'string',
            description: '"top" | "bottom" | "topbottom" | "center" | "scale"',
          },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: any) => {
        await getShape(penpotClient, args.fileId, args.pageId, args.shapeId);
        const operations: any[] = [];
        if (args.constraintsH !== undefined) {
          operations.push({ type: 'set', attr: 'constraintsH', val: args.constraintsH });
        }
        if (args.constraintsV !== undefined) {
          operations.push({ type: 'set', attr: 'constraintsV', val: args.constraintsV });
        }
        if (!operations.length) {
          throw new Error('Provide constraintsH and/or constraintsV');
        }
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
              text: `Set constraints on ${args.shapeId}: H=${args.constraintsH ?? '(unchanged)'} V=${args.constraintsV ?? '(unchanged)'}`,
            },
          ],
        };
      },
    },

    set_interactions: {
      description:
        'Set prototype interactions on a shape (click → navigate, overlay, URL, etc.). Replaces the full interactions array.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeId: { type: 'string' },
          interactions: {
            type: 'string',
            description:
              'JSON array of interactions. Example: [{"actionType":"navigate","eventType":"click","destination":"<frame-id>","animation":{"animationType":"dissolve","duration":300,"easing":"ease"}}]',
          },
          clear: {
            type: 'boolean',
            description: 'If true, clears all interactions',
            default: false,
          },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: any) => {
        await getShape(penpotClient, args.fileId, args.pageId, args.shapeId);
        let interactions: any[] = [];
        if (!args.clear) {
          if (!args.interactions) {
            throw new Error('Provide interactions JSON or clear=true');
          }
          interactions = JSON.parse(args.interactions);
          if (!Array.isArray(interactions)) {
            throw new Error('interactions must be a JSON array');
          }
        }
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'mod-obj',
            id: args.shapeId,
            pageId: args.pageId,
            operations: [{ type: 'set', attr: 'interactions', val: interactions }],
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.clear
                ? `Cleared interactions on ${args.shapeId}`
                : `Set ${interactions.length} interaction(s) on ${args.shapeId}`,
            },
          ],
        };
      },
    },

    set_flow: {
      description:
        'Create or update a prototype flow (starting board) on a page. Pass delete=true to remove.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          flowId: { type: 'string' },
          name: { type: 'string', default: 'Flow' },
          startingFrame: {
            type: 'string',
            description: 'Frame id that starts the prototype',
          },
          delete: { type: 'boolean', default: false },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const id = args.flowId || uuidv4();
        const params = args.delete
          ? null
          : {
              id,
              name: args.name || 'Flow',
              startingFrame: args.startingFrame,
            };
        if (!args.delete && !args.startingFrame) {
          throw new Error('startingFrame is required unless delete=true');
        }
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'set-flow',
            pageId: args.pageId,
            id,
            params,
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.delete
                ? `Deleted flow ${id}`
                : `Set flow ${params?.name} (${id}) starting at ${args.startingFrame}`,
            },
          ],
        };
      },
    },

    set_guide: {
      description: 'Add, move, or delete a page guide. Pass delete=true to remove.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          guideId: { type: 'string' },
          axis: { type: 'string', description: '"x" or "y"' },
          position: { type: 'number' },
          frameId: { type: 'string' },
          delete: { type: 'boolean', default: false },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const id = args.guideId || uuidv4();
        const params = args.delete
          ? null
          : {
              id,
              axis: args.axis || 'x',
              position: args.position ?? 0,
              ...(args.frameId && { frameId: args.frameId }),
            };
        if (!args.delete && args.position === undefined) {
          throw new Error('position is required unless delete=true');
        }
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'set-guide',
            pageId: args.pageId,
            id,
            params,
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.delete
                ? `Deleted guide ${id}`
                : `Set guide ${id} on ${params?.axis}=${params?.position}`,
            },
          ],
        };
      },
    },
  };
}
