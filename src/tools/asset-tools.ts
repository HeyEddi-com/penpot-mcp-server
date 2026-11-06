/**
 * Shared file colors and typography styles.
 */

import { v4 as uuidv4 } from 'uuid';
import { PenpotClient } from '../penpot-client.js';

function fileData(file: any): any {
  return file.data || {};
}

export function createAssetTools(penpotClient: PenpotClient) {
  return {
    list_colors: {
      description: 'List shared colors stored in a file.',
      inputSchema: {
        type: 'object',
        properties: { fileId: { type: 'string' } },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const colors = fileData(file).colors || {};
        const list = Object.values(colors);
        return {
          content: [
            { type: 'text', text: `Found ${list.length} color(s)` },
            { type: 'text', text: JSON.stringify(list, null, 2) },
          ],
        };
      },
    },

    add_color: {
      description: 'Add a shared color (solid, gradient, or image) to the file palette.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          name: { type: 'string' },
          path: { type: 'string', description: 'Palette folder path' },
          color: { type: 'string', description: 'HEX color for a solid swatch' },
          opacity: { type: 'number', default: 1 },
          gradientType: { type: 'string', description: '"linear" or "radial"' },
          gradientStartX: { type: 'number', default: 0 },
          gradientStartY: { type: 'number', default: 0 },
          gradientEndX: { type: 'number', default: 1 },
          gradientEndY: { type: 'number', default: 1 },
          gradientStops: {
            type: 'string',
            description: 'JSON array of {color, opacity?, offset}',
          },
        },
        required: ['fileId', 'name'],
      },
      handler: async (args: any) => {
        const id = uuidv4();
        const color: any = {
          id,
          name: args.name,
          path: args.path || '',
          opacity: args.opacity !== undefined ? args.opacity : 1,
        };
        if (args.gradientType && args.gradientStops) {
          color.gradient = {
            type: args.gradientType,
            startX: args.gradientStartX ?? 0,
            startY: args.gradientStartY ?? 0,
            endX: args.gradientEndX ?? 1,
            endY: args.gradientEndY ?? 1,
            width: 1,
            stops: JSON.parse(args.gradientStops),
          };
        } else if (args.color) {
          color.color = args.color;
        } else {
          throw new Error('Provide color (HEX) or gradientType + gradientStops');
        }
        await penpotClient.applyChanges(args.fileId, [{ type: 'add-color', color }] as any);
        return {
          content: [
            { type: 'text', text: `Added color ${args.name} (ID: ${id})` },
            { type: 'text', text: JSON.stringify(color, null, 2) },
          ],
        };
      },
    },

    update_color: {
      description: 'Update a shared color swatch.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          colorId: { type: 'string' },
          name: { type: 'string' },
          path: { type: 'string' },
          color: { type: 'string' },
          opacity: { type: 'number' },
        },
        required: ['fileId', 'colorId'],
      },
      handler: async (args: any) => {
        const file = await penpotClient.getFile(args.fileId);
        const existing = (fileData(file).colors || {})[args.colorId];
        if (!existing) {throw new Error(`Color not found: ${args.colorId}`);}
        const color = {
          ...existing,
          id: args.colorId,
          ...(args.name !== undefined && { name: args.name }),
          ...(args.path !== undefined && { path: args.path }),
          ...(args.color !== undefined && { color: args.color }),
          ...(args.opacity !== undefined && { opacity: args.opacity }),
        };
        await penpotClient.applyChanges(args.fileId, [{ type: 'mod-color', color }] as any);
        return {
          content: [{ type: 'text', text: `Updated color ${args.colorId}` }],
        };
      },
    },

    delete_color: {
      description: 'Delete a shared color from the file palette.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          colorId: { type: 'string' },
        },
        required: ['fileId', 'colorId'],
      },
      handler: async (args: { fileId: string; colorId: string }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'del-color', id: args.colorId },
        ] as any);
        return {
          content: [{ type: 'text', text: `Deleted color ${args.colorId}` }],
        };
      },
    },

    list_typographies: {
      description: 'List shared typography styles in a file.',
      inputSchema: {
        type: 'object',
        properties: { fileId: { type: 'string' } },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const typographies = fileData(file).typographies || {};
        const list = Object.values(typographies);
        return {
          content: [
            { type: 'text', text: `Found ${list.length} typography style(s)` },
            { type: 'text', text: JSON.stringify(list, null, 2) },
          ],
        };
      },
    },

    add_typography: {
      description: 'Add a shared typography style to the file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          name: { type: 'string' },
          path: { type: 'string' },
          fontId: { type: 'string', default: 'sourcesanspro' },
          fontFamily: { type: 'string', default: 'sourcesanspro' },
          fontVariantId: { type: 'string', default: 'regular' },
          fontSize: { type: 'string', default: '16' },
          fontWeight: { type: 'string', default: '400' },
          fontStyle: { type: 'string', default: 'normal' },
          lineHeight: { type: 'string', default: '1.2' },
          letterSpacing: { type: 'string', default: '0' },
          textTransform: { type: 'string', default: 'none' },
        },
        required: ['fileId', 'name'],
      },
      handler: async (args: any) => {
        const id = uuidv4();
        const typography = {
          id,
          name: args.name,
          path: args.path || null,
          fontId: args.fontId || 'sourcesanspro',
          fontFamily: args.fontFamily || 'sourcesanspro',
          fontVariantId: args.fontVariantId || 'regular',
          fontSize: String(args.fontSize || '16'),
          fontWeight: String(args.fontWeight || '400'),
          fontStyle: args.fontStyle || 'normal',
          lineHeight: String(args.lineHeight || '1.2'),
          letterSpacing: String(args.letterSpacing || '0'),
          textTransform: args.textTransform || 'none',
        };
        await penpotClient.applyChanges(args.fileId, [
          { type: 'add-typography', typography },
        ] as any);
        return {
          content: [
            { type: 'text', text: `Added typography ${args.name} (ID: ${id})` },
            { type: 'text', text: JSON.stringify(typography, null, 2) },
          ],
        };
      },
    },

    update_typography: {
      description: 'Update a shared typography style.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          typographyId: { type: 'string' },
          name: { type: 'string' },
          fontFamily: { type: 'string' },
          fontSize: { type: 'string' },
          fontWeight: { type: 'string' },
          fontStyle: { type: 'string' },
          lineHeight: { type: 'string' },
          letterSpacing: { type: 'string' },
          textTransform: { type: 'string' },
          path: { type: 'string' },
        },
        required: ['fileId', 'typographyId'],
      },
      handler: async (args: any) => {
        const file = await penpotClient.getFile(args.fileId);
        const existing = (fileData(file).typographies || {})[args.typographyId];
        if (!existing) {throw new Error(`Typography not found: ${args.typographyId}`);}
        const typography = {
          ...existing,
          id: args.typographyId,
          ...(args.name !== undefined && { name: args.name }),
          ...(args.path !== undefined && { path: args.path }),
          ...(args.fontFamily !== undefined && { fontFamily: args.fontFamily }),
          ...(args.fontSize !== undefined && { fontSize: String(args.fontSize) }),
          ...(args.fontWeight !== undefined && { fontWeight: String(args.fontWeight) }),
          ...(args.fontStyle !== undefined && { fontStyle: args.fontStyle }),
          ...(args.lineHeight !== undefined && { lineHeight: String(args.lineHeight) }),
          ...(args.letterSpacing !== undefined && {
            letterSpacing: String(args.letterSpacing),
          }),
          ...(args.textTransform !== undefined && { textTransform: args.textTransform }),
        };
        await penpotClient.applyChanges(args.fileId, [
          { type: 'mod-typography', typography },
        ] as any);
        return {
          content: [{ type: 'text', text: `Updated typography ${args.typographyId}` }],
        };
      },
    },

    delete_typography: {
      description: 'Delete a shared typography style.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          typographyId: { type: 'string' },
        },
        required: ['fileId', 'typographyId'],
      },
      handler: async (args: { fileId: string; typographyId: string }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'del-typography', id: args.typographyId },
        ] as any);
        return {
          content: [{ type: 'text', text: `Deleted typography ${args.typographyId}` }],
        };
      },
    },
  };
}
