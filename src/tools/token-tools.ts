/**
 * Design tokens (Penpot tokens lib): sets, themes, individual tokens.
 */

import { v4 as uuidv4 } from 'uuid';
import { PenpotClient } from '../penpot-client.js';

const TOKEN_TYPES = [
  'sizing',
  'rotation',
  'color',
  'number',
  'font-size',
  'font-weight',
  'text-case',
  'other',
  'string',
  'dimensions',
  'stroke-width',
  'opacity',
  'typography',
  'text-decoration',
  'letter-spacing',
  'border-radius',
  'boolean',
  'font-family',
  'spacing',
] as const;

export function createTokenTools(penpotClient: PenpotClient) {
  return {
    list_tokens: {
      description: 'List design token sets / themes from the file tokens library.',
      inputSchema: {
        type: 'object',
        properties: { fileId: { type: 'string' } },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const tokensLib = data?.tokensLib || data?.['tokens-lib'] || null;
        return {
          content: [
            {
              type: 'text',
              text: tokensLib ? 'Tokens library present' : 'No tokens library on this file yet',
            },
            {
              type: 'text',
              text: JSON.stringify(tokensLib || {}, null, 2),
            },
          ],
        };
      },
    },

    set_token_set: {
      description: 'Create or replace a design-token set. Pass attrs null to delete.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          setId: { type: 'string', description: 'Token set UUID (generated if omitted on create)' },
          name: { type: 'string' },
          description: { type: 'string' },
          delete: {
            type: 'boolean',
            description: 'If true, deletes the set (attrs null)',
            default: false,
          },
        },
        required: ['fileId'],
      },
      handler: async (args: {
        fileId: string;
        setId?: string;
        name?: string;
        description?: string;
        delete?: boolean;
      }) => {
        const id = args.setId || uuidv4();
        const attrs = args.delete
          ? null
          : {
              id,
              name: args.name || 'Tokens',
              description: args.description || '',
            };
        await penpotClient.applyChanges(args.fileId, [{ type: 'set-token-set', id, attrs }] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.delete
                ? `Deleted token set ${id}`
                : `Set token set ${id} (${attrs?.name})`,
            },
          ],
        };
      },
    },

    set_token: {
      description: 'Create, update, or delete one token inside a set. Pass delete=true to remove.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          setId: { type: 'string' },
          tokenId: { type: 'string' },
          name: { type: 'string' },
          type: {
            type: 'string',
            description: `One of: ${TOKEN_TYPES.join(', ')}`,
          },
          value: {
            description: 'Token value (string, number, or JSON-serializable object)',
          },
          description: { type: 'string' },
          delete: { type: 'boolean', default: false },
        },
        required: ['fileId', 'setId'],
      },
      handler: async (args: any) => {
        const tokenId = args.tokenId || uuidv4();
        const attrs = args.delete
          ? null
          : {
              id: tokenId,
              name: args.name || 'token',
              type: args.type || 'other',
              value: args.value,
              description: args.description || '',
            };
        if (!args.delete && args.value === undefined) {
          throw new Error('value is required unless delete=true');
        }
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'set-token',
            setId: args.setId,
            tokenId,
            attrs,
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.delete
                ? `Deleted token ${tokenId}`
                : `Set token ${attrs?.name} (${tokenId}) type=${attrs?.type}`,
            },
          ],
        };
      },
    },

    set_token_theme: {
      description: 'Create or replace a token theme. Pass delete=true to remove.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          themeId: { type: 'string' },
          name: { type: 'string' },
          group: { type: 'string' },
          description: { type: 'string' },
          sets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Token set names or ids enabled in this theme',
          },
          delete: { type: 'boolean', default: false },
        },
        required: ['fileId'],
      },
      handler: async (args: any) => {
        const id = args.themeId || uuidv4();
        const attrs = args.delete
          ? null
          : {
              id,
              name: args.name || 'Theme',
              group: args.group || '',
              description: args.description || '',
              sets: args.sets || [],
            };
        await penpotClient.applyChanges(args.fileId, [
          { type: 'set-token-theme', id, attrs },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: args.delete ? `Deleted theme ${id}` : `Set theme ${attrs?.name} (${id})`,
            },
          ],
        };
      },
    },

    set_active_token_themes: {
      description: 'Activate token themes by path (group/name).',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          themePaths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Theme paths such as "Mode/Light"',
          },
        },
        required: ['fileId', 'themePaths'],
      },
      handler: async (args: { fileId: string; themePaths: string[] }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'set-active-token-themes', themePaths: args.themePaths },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: `Active themes: ${args.themePaths.join(', ') || '(none)'}`,
            },
          ],
        };
      },
    },
  };
}
