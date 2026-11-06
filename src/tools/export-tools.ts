/**
 * Export a shape through Penpot's exporter and return the rendered image.
 *
 * OpenAPI does not document this. The live call is POST /api/export
 * (transit+json, cmd export-shapes, wait true). See src/export-protocol.ts.
 */

import { PenpotClient } from '../penpot-client.js';
import { normalizeExportType } from '../export-protocol.js';
import { auditObjects, formatAudit } from '../board-audit.js';

const RASTER_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function createExportTools(penpotClient: PenpotClient) {
  return {
    export_shape: {
      description:
        'Render a frame or shape and return the image in this tool result so you can see what you drew. Call it after creating or changing a board, then look at the image before you finish. Fixes overflow, empty frames, and photos that do not fill their frame. Uses Penpot POST /api/export (export-shapes). fileId, pageId, and shapeId are required.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Frame or shape ID to render' },
          format: {
            type: 'string',
            description: 'png (default), jpeg, webp, svg, or pdf',
            enum: ['png', 'jpeg', 'jpg', 'webp', 'svg', 'pdf'],
          },
          scale: {
            type: 'number',
            description: 'Export scale. Default 1. Maximum 4.',
          },
          name: {
            type: 'string',
            description: 'File name stem. Defaults to the shape id.',
          },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        shapeId: string;
        format?: string;
        scale?: number;
        name?: string;
      }) => {
        const format = normalizeExportType(args.format);
        const rendered = await penpotClient.exportShape({
          fileId: args.fileId,
          pageId: args.pageId,
          shapeId: args.shapeId,
          format,
          scale: args.scale,
          name: args.name,
        });

        const mime = rendered.mtype || 'application/octet-stream';
        const summary = `Rendered ${rendered.filename || args.shapeId} (${mime}, ${rendered.bytes.length} bytes). This is the board as Penpot drew it. Look at it before you finish.`;

        if (RASTER_MIME.has(mime) && rendered.bytes.length <= 2_000_000) {
          return {
            content: [
              { type: 'text' as const, text: summary },
              {
                type: 'image' as const,
                data: rendered.bytes.toString('base64'),
                mimeType: mime,
              },
            ],
          };
        }

        if (mime.includes('svg') || format === 'svg') {
          const markup = rendered.bytes.toString('utf8');
          return {
            content: [
              { type: 'text' as const, text: summary },
              { type: 'text' as const, text: markup.slice(0, 100_000) },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `${summary} Download: ${rendered.uri}`,
            },
          ],
        };
      },
    },

    audit_board: {
      description:
        'Check a page for overlapping siblings, photos that sit in the corner of a frame, and empty screens. Call this after you create or move shapes. Fix every reported line and call it again before you finish. Then call export_shape and look at the PNG.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: { fileId: string; pageId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as {
          pagesIndex?: Record<string, { objects?: Record<string, unknown> }>;
          'pages-index'?: Record<string, { objects?: Record<string, unknown> }>;
        };
        const pages = data.pagesIndex || data['pages-index'] || {};
        const page = pages[args.pageId];
        if (!page?.objects) {
          throw new Error(`Page not found: ${args.pageId}`);
        }
        const issues = auditObjects(page.objects);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatAudit(issues),
            },
          ],
        };
      },
    },
  };
}
