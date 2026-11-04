/**
 * Alignment Tools - Shape alignment and distribution
 */

import { PenpotClient } from '../penpot-client.js';

export function createAlignmentTools(penpotClient: PenpotClient) {
  return {
    align_shapes: {
      description: 'Align multiple shapes relative to each other or to a selection bounds',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align',
            minItems: 2,
          },
          alignment: {
            type: 'string',
            description: 'Alignment type',
            enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
          },
        },
        required: ['fileId', 'pageId', 'shapeIds', 'alignment'],
      },
      handler: async (args: any) => {
        // Get file data
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        const objects = page.objects || {};

        // Get all shapes to align
        const shapes = args.shapeIds.map((id: string) => {
          const shape = objects[id];
          if (!shape) {
            throw new Error(`Shape not found: ${id}`);
          }
          return {
            id,
            x: shape.x || 0,
            y: shape.y || 0,
            width: shape.width || 0,
            height: shape.height || 0,
          };
        });

        // Calculate alignment target based on selection bounds
        let targetValue: number;
        const changes: any[] = [];

        switch (args.alignment) {
          case 'left': {
            // Align to leftmost x
            targetValue = Math.min(...shapes.map((s: any) => s.x));
            shapes.forEach((shape: any) => {
              if (shape.x !== targetValue) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'x', val: targetValue }],
                });
              }
            });
            break;
          }

          case 'center': {
            // Align to center x of selection bounds
            const minX = Math.min(...shapes.map((s: any) => s.x));
            const maxX = Math.max(...shapes.map((s: any) => s.x + s.width));
            const centerX = (minX + maxX) / 2;

            shapes.forEach((shape: any) => {
              const newX = centerX - shape.width / 2;
              if (shape.x !== newX) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'x', val: newX }],
                });
              }
            });
            break;
          }

          case 'right': {
            // Align to rightmost x + width
            const rightEdge = Math.max(...shapes.map((s: any) => s.x + s.width));
            shapes.forEach((shape: any) => {
              const newX = rightEdge - shape.width;
              if (shape.x !== newX) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'x', val: newX }],
                });
              }
            });
            break;
          }

          case 'top': {
            // Align to topmost y
            targetValue = Math.min(...shapes.map((s: any) => s.y));
            shapes.forEach((shape: any) => {
              if (shape.y !== targetValue) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'y', val: targetValue }],
                });
              }
            });
            break;
          }

          case 'middle': {
            // Align to center y of selection bounds
            const minY = Math.min(...shapes.map((s: any) => s.y));
            const maxY = Math.max(...shapes.map((s: any) => s.y + s.height));
            const centerY = (minY + maxY) / 2;

            shapes.forEach((shape: any) => {
              const newY = centerY - shape.height / 2;
              if (shape.y !== newY) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'y', val: newY }],
                });
              }
            });
            break;
          }

          case 'bottom': {
            // Align to bottommost y + height
            const bottomEdge = Math.max(...shapes.map((s: any) => s.y + s.height));
            shapes.forEach((shape: any) => {
              const newY = bottomEdge - shape.height;
              if (shape.y !== newY) {
                changes.push({
                  type: 'mod-obj',
                  id: shape.id,
                  pageId: args.pageId,
                  operations: [{ type: 'set', attr: 'y', val: newY }],
                });
              }
            });
            break;
          }

          default:
            throw new Error(`Invalid alignment type: ${args.alignment}`);
        }

        // Apply all changes
        if (changes.length > 0) {
          await penpotClient.applyChanges(args.fileId, changes);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Aligned ${shapes.length} shapes to ${args.alignment} (${changes.length} shapes moved)`,
            },
          ],
        };
      },
    },

    distribute_shapes: {
      description: 'Distribute multiple shapes evenly with equal spacing',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute (at least 3 shapes)',
            minItems: 3,
          },
          direction: {
            type: 'string',
            description: 'Distribution direction',
            enum: ['horizontal', 'vertical'],
          },
        },
        required: ['fileId', 'pageId', 'shapeIds', 'direction'],
      },
      handler: async (args: any) => {
        if (args.shapeIds.length < 3) {
          throw new Error('At least 3 shapes are required for distribution');
        }

        // Get file data
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        const objects = page.objects || {};

        // Get all shapes to distribute
        const shapes = args.shapeIds.map((id: string) => {
          const shape = objects[id];
          if (!shape) {
            throw new Error(`Shape not found: ${id}`);
          }
          return {
            id,
            x: shape.x || 0,
            y: shape.y || 0,
            width: shape.width || 0,
            height: shape.height || 0,
          };
        });

        const changes: any[] = [];

        if (args.direction === 'horizontal') {
          // Sort by x position
          shapes.sort((a: any, b: any) => a.x - b.x);

          // Keep first and last in place, distribute middle ones
          const first = shapes[0];
          const last = shapes[shapes.length - 1];
          const totalSpace = last.x - (first.x + first.width);
          const middleShapes = shapes.slice(1, -1);

          // Calculate total width of middle shapes
          const middleShapesWidth = middleShapes.reduce((sum: any, s: any) => sum + s.width, 0);

          // Calculate gap between shapes
          const gap = (totalSpace - middleShapesWidth) / (shapes.length - 1);

          // Position middle shapes
          let currentX = first.x + first.width + gap;
          middleShapes.forEach((shape: any) => {
            if (shape.x !== currentX) {
              changes.push({
                type: 'mod-obj',
                id: shape.id,
                pageId: args.pageId,
                operations: [{ type: 'set', attr: 'x', val: currentX }],
              });
            }
            currentX += shape.width + gap;
          });
        } else {
          // vertical
          // Sort by y position
          shapes.sort((a: any, b: any) => a.y - b.y);

          // Keep first and last in place, distribute middle ones
          const first = shapes[0];
          const last = shapes[shapes.length - 1];
          const totalSpace = last.y - (first.y + first.height);
          const middleShapes = shapes.slice(1, -1);

          // Calculate total height of middle shapes
          const middleShapesHeight = middleShapes.reduce((sum: any, s: any) => sum + s.height, 0);

          // Calculate gap between shapes
          const gap = (totalSpace - middleShapesHeight) / (shapes.length - 1);

          // Position middle shapes
          let currentY = first.y + first.height + gap;
          middleShapes.forEach((shape: any) => {
            if (shape.y !== currentY) {
              changes.push({
                type: 'mod-obj',
                id: shape.id,
                pageId: args.pageId,
                operations: [{ type: 'set', attr: 'y', val: currentY }],
              });
            }
            currentY += shape.height + gap;
          });
        }

        // Apply all changes
        if (changes.length > 0) {
          await penpotClient.applyChanges(args.fileId, changes);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Distributed ${shapes.length} shapes ${args.direction}ly (${changes.length} shapes moved)`,
            },
          ],
        };
      },
    },
  };
}
