/**
 * PageAdvanced Tools - Advanced page operations
 */

import { PenpotClient } from '../penpot-client.js';
import { v4 as uuidv4 } from 'uuid';
import {
  frameLayoutSchemaProps,
  layoutItemSchemaProps,
  layoutModOperations,
} from '../layout-helpers.js';

export function createPageAdvancedTools(penpotClient: PenpotClient) {
  return {
    get_page_shapes: {
      description: 'Get all shapes on a specific page',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          pageId: {
            type: 'string',
            description: 'Page ID',
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: { fileId: string; pageId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        const objects = page.objects || {};
        const shapes = Object.entries(objects)
          .map(([id, obj]: [string, any]) => ({
            id,
            name: obj.name,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
          }))
          .filter((s: any) => s.type !== 'frame' || s.name !== 'Root');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${shapes.length} shapes on page`,
            },
            {
              type: 'text',
              text: JSON.stringify(shapes, null, 2),
            },
          ],
        };
      },
    },

    query_shapes: {
      description:
        'Query and filter shapes with multiple criteria (like grep for shapes). Useful for bulk operations like changing color themes, alignment, or filtering by area/type. Returns only the requested fields.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          // Filter criteria
          types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by shape types (e.g., ["text", "rectangle", "circle"])',
          },
          namePattern: { type: 'string', description: 'Filter by name pattern (regex)' },
          minX: { type: 'number', description: 'Minimum X position (area filter)' },
          maxX: { type: 'number', description: 'Maximum X position (area filter)' },
          minY: { type: 'number', description: 'Minimum Y position (area filter)' },
          maxY: { type: 'number', description: 'Maximum Y position (area filter)' },
          fillColor: { type: 'string', description: 'Filter by fill color (HEX, e.g., "#FF0000")' },
          strokeColor: { type: 'string', description: 'Filter by stroke color (HEX)' },
          fontFamily: { type: 'string', description: 'Filter by font family (for text shapes)' },
          textContent: {
            type: 'string',
            description: 'Filter by text content (case-insensitive substring match)',
          },
          // Fields to return
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Fields to return: "position" (x,y,width,height), "colors" (fill,stroke), "text" (font props), "effects" (shadow,blur), "all". Default: ["position"]',
            default: ['position'],
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        types?: string[];
        namePattern?: string;
        minX?: number;
        maxX?: number;
        minY?: number;
        maxY?: number;
        fillColor?: string;
        strokeColor?: string;
        fontFamily?: string;
        textContent?: string;
        fields?: string[];
      }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        const objects = page.objects || {};
        const fields = args.fields || ['position'];
        const includeAll = fields.includes('all');

        // Filter shapes
        const shapes = Object.entries(objects)
          .map(([id, obj]: [string, any]) => ({ id, ...obj }))
          .filter((shape: any) => {
            // Exclude root frame
            if (shape.type === 'frame' && shape.name === 'Root') {
              return false;
            }

            // Filter by type
            if (args.types && args.types.length > 0) {
              if (!args.types.includes(shape.type)) {
                return false;
              }
            }

            // Filter by name pattern
            if (args.namePattern) {
              try {
                const regex = new RegExp(args.namePattern, 'i');
                if (!regex.test(shape.name)) {
                  return false;
                }
              } catch (e) {
                // Invalid regex, skip this filter
              }
            }

            // Filter by area
            if (args.minX !== undefined && shape.x < args.minX) {
              return false;
            }
            if (args.maxX !== undefined && shape.x > args.maxX) {
              return false;
            }
            if (args.minY !== undefined && shape.y < args.minY) {
              return false;
            }
            if (args.maxY !== undefined && shape.y > args.maxY) {
              return false;
            }

            // Filter by fill color
            if (args.fillColor) {
              const fillColor = shape.fills?.[0]?.fillColor?.toLowerCase();
              if (!fillColor || fillColor !== args.fillColor.toLowerCase()) {
                return false;
              }
            }

            // Filter by stroke color
            if (args.strokeColor) {
              const strokeColor = shape.strokes?.[0]?.strokeColor?.toLowerCase();
              if (!strokeColor || strokeColor !== args.strokeColor.toLowerCase()) {
                return false;
              }
            }

            // Filter by font family
            if (args.fontFamily) {
              if (shape.type !== 'text' || !shape.fontFamily) {
                return false;
              }
              if (shape.fontFamily.toLowerCase() !== args.fontFamily.toLowerCase()) {
                return false;
              }
            }

            // Filter by text content
            if (args.textContent) {
              if (shape.type !== 'text' || !shape.content) {
                return false;
              }

              // Extract text content from content structure
              let textContent = '';
              if (shape.content?.children?.[0]?.children) {
                shape.content.children[0].children.forEach((paragraph: any) => {
                  if (paragraph.children) {
                    paragraph.children.forEach((textNode: any) => {
                      if (textNode.text) {
                        textContent += textNode.text;
                      }
                    });
                  }
                });
              }

              // Case-insensitive substring match
              if (!textContent.toLowerCase().includes(args.textContent.toLowerCase())) {
                return false;
              }
            }

            return true;
          });

        // Extract requested fields
        const results = shapes.map((shape: any) => {
          const result: any = {
            id: shape.id,
            name: shape.name,
            type: shape.type,
          };

          // Position fields
          if (includeAll || fields.includes('position')) {
            result.x = shape.x;
            result.y = shape.y;
            result.width = shape.width;
            result.height = shape.height;
            if (shape.rotation !== undefined) {
              result.rotation = shape.rotation;
            }
          }

          // Color fields
          if (includeAll || fields.includes('colors')) {
            if (shape.fills && shape.fills.length > 0) {
              const fill = shape.fills[0];
              result.fillColor = fill.fillColor;
              result.fillOpacity = fill.fillOpacity;
              if (fill.fillColorGradient) {
                result.gradient = fill.fillColorGradient;
              }
            }
            if (shape.strokes && shape.strokes.length > 0) {
              const stroke = shape.strokes[0];
              result.strokeColor = stroke.strokeColor;
              result.strokeWidth = stroke.strokeWidth;
              result.strokeOpacity = stroke.strokeOpacity;
            }
          }

          // Text fields
          if (includeAll || fields.includes('text')) {
            if (shape.type === 'text') {
              result.text = {
                fontSize: shape.fontSize,
                fontFamily: shape.fontFamily,
                fontWeight: shape.fontWeight,
                fontStyle: shape.fontStyle,
                verticalAlign: shape.verticalAlign,
                textDecoration: shape.textDecoration,
                letterSpacing: shape.letterSpacing,
                lineHeight: shape.lineHeight,
              };

              // Extract text content and alignment
              if (shape.content?.children?.[0]?.children) {
                const textContent: string[] = [];
                const textAlignments: string[] = [];
                shape.content.children[0].children.forEach((paragraph: any) => {
                  if (paragraph.textAlign) {
                    textAlignments.push(paragraph.textAlign);
                  }
                  if (paragraph.children) {
                    paragraph.children.forEach((textNode: any) => {
                      if (textNode.text) {
                        textContent.push(textNode.text);
                      }
                    });
                  }
                });
                result.text.content = textContent.join('');
                if (textAlignments.length > 0) {
                  result.text.textAlign = textAlignments[0];
                }
              }
            }
          }

          // Effects fields
          if (includeAll || fields.includes('effects')) {
            if (shape.opacity !== undefined) {
              result.opacity = shape.opacity;
            }
            if (shape.blendMode) {
              result.blendMode = shape.blendMode;
            }

            if (shape.shadow && shape.shadow.length > 0) {
              result.shadows = shape.shadow.map((s: any) => ({
                style: s.style,
                offsetX: s.offsetX,
                offsetY: s.offsetY,
                blur: s.blur,
                spread: s.spread,
                color: s.color?.color,
                opacity: s.color?.opacity,
              }));
            }

            if (shape.blur) {
              result.blur = {
                type: shape.blur.type,
                value: shape.blur.value,
              };
            }
          }

          return result;
        });

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} shapes matching criteria`,
            },
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      },
    },

    update_shape: {
      description:
        'Update shape properties including position, size, colors, gradients, images, borders, shadows, blur, blend modes, text alignment, and visual effects',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape ID' },
          x: { type: 'number', description: 'X position' },
          y: { type: 'number', description: 'Y position' },
          width: { type: 'number', description: 'Width' },
          height: { type: 'number', description: 'Height' },
          name: { type: 'string', description: 'Shape name' },
          fillColor: { type: 'string', description: 'Fill color (HEX)' },
          fillOpacity: { type: 'number', description: 'Fill opacity (0-1)' },
          gradientType: { type: 'string', description: 'Gradient type: "linear" or "radial"' },
          gradientStartX: { type: 'number', description: 'Gradient start X (0-1 normalized)' },
          gradientStartY: { type: 'number', description: 'Gradient start Y (0-1 normalized)' },
          gradientEndX: { type: 'number', description: 'Gradient end X (0-1 normalized)' },
          gradientEndY: { type: 'number', description: 'Gradient end Y (0-1 normalized)' },
          gradientStops: { type: 'string', description: 'Gradient stops as JSON array' },
          fillImageId: { type: 'string', description: 'Image media ID' },
          fillImageName: { type: 'string', description: 'Image name' },
          fillImageWidth: { type: 'number', description: 'Image width' },
          fillImageHeight: { type: 'number', description: 'Image height' },
          fillImageMtype: { type: 'string', description: 'Image MIME type' },
          fillImageKeepAspectRatio: { type: 'boolean', description: 'Keep image aspect ratio' },
          strokeColor: { type: 'string', description: 'Stroke color (HEX)' },
          strokeWidth: { type: 'number', description: 'Stroke width' },
          strokeOpacity: { type: 'number', description: 'Stroke opacity (0-1)' },
          r1: { type: 'number', description: 'Top-left corner radius' },
          r2: { type: 'number', description: 'Top-right corner radius' },
          r3: { type: 'number', description: 'Bottom-right corner radius' },
          r4: { type: 'number', description: 'Bottom-left corner radius' },
          borderRadius: { type: 'number', description: 'All corners radius (shorthand)' },
          opacity: { type: 'number', description: 'Overall opacity (0-1)' },
          shadowColor: { type: 'string', description: 'Shadow color (HEX)' },
          shadowOffsetX: { type: 'number', description: 'Shadow X offset in pixels' },
          shadowOffsetY: { type: 'number', description: 'Shadow Y offset in pixels' },
          shadowBlur: { type: 'number', description: 'Shadow blur radius in pixels' },
          shadowSpread: { type: 'number', description: 'Shadow spread in pixels' },
          shadowOpacity: { type: 'number', description: 'Shadow opacity (0-1)' },
          shadowStyle: {
            type: 'string',
            description: 'Shadow style: "drop-shadow" or "inner-shadow"',
          },
          blurValue: { type: 'number', description: 'Blur intensity in pixels' },
          blendMode: {
            type: 'string',
            description: 'Blend mode: "normal", "multiply", "screen", "overlay", etc.',
          },
          fontSize: { type: 'number', description: 'Font size for text shapes' },
          textAlign: {
            type: 'string',
            description: 'Text alignment for text shapes: "left", "center", "right", "justify"',
          },
          verticalAlign: {
            type: 'string',
            description: 'Vertical alignment for text shapes: "top", "center", "bottom"',
          },
          fontFamily: { type: 'string', description: 'Font family for text shapes' },
          fontWeight: {
            type: 'string',
            description: 'Font weight for text shapes: "normal", "bold", "100"-"900"',
          },
          fontStyle: {
            type: 'string',
            description: 'Font style for text shapes: "normal", "italic"',
          },
          textDecoration: {
            type: 'string',
            description: 'Text decoration for text shapes: "none", "underline", "line-through"',
          },
          letterSpacing: {
            type: 'number',
            description: 'Letter spacing in pixels for text shapes',
          },
          lineHeight: { type: 'number', description: 'Line height multiplier for text shapes' },
          ...frameLayoutSchemaProps,
          ...layoutItemSchemaProps,
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: any) => {
        // Get the current shape to check its type
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];
        const currentShape = page?.objects?.[args.shapeId];

        if (!currentShape) {
          throw new Error(`Shape not found: ${args.shapeId}`);
        }

        const changes: any = {
          type: 'mod-obj',
          id: args.shapeId,
          pageId: args.pageId,
          operations: [],
        };

        // Basic properties
        if (args.x !== undefined) {
          changes.operations.push({ type: 'set', attr: 'x', val: args.x });
        }
        if (args.y !== undefined) {
          changes.operations.push({ type: 'set', attr: 'y', val: args.y });
        }
        if (args.width !== undefined) {
          changes.operations.push({ type: 'set', attr: 'width', val: args.width });
        }
        if (args.height !== undefined) {
          changes.operations.push({ type: 'set', attr: 'height', val: args.height });
        }
        if (args.name !== undefined) {
          changes.operations.push({ type: 'set', attr: 'name', val: args.name });
        }

        // Fill properties - priority: gradient > image > solid color
        if (args.gradientType && args.gradientStops) {
          // Gradient fill
          const stops = JSON.parse(args.gradientStops);
          const fills = [
            {
              fillColorGradient: {
                type: args.gradientType,
                startX: args.gradientStartX !== undefined ? args.gradientStartX : 0,
                startY: args.gradientStartY !== undefined ? args.gradientStartY : 0,
                endX: args.gradientEndX !== undefined ? args.gradientEndX : 1,
                endY: args.gradientEndY !== undefined ? args.gradientEndY : 1,
                width: 1,
                stops,
              },
            },
          ];
          changes.operations.push({ type: 'set', attr: 'fills', val: fills });
        } else if (args.fillImageId) {
          // Image fill
          const fills = [
            {
              fillImage: {
                width: args.fillImageWidth,
                height: args.fillImageHeight,
                mtype: args.fillImageMtype || 'image/png',
                id: args.fillImageId,
                name: args.fillImageName || 'image',
                keepAspectRatio:
                  args.fillImageKeepAspectRatio !== undefined
                    ? args.fillImageKeepAspectRatio
                    : true,
              },
            },
          ];
          changes.operations.push({ type: 'set', attr: 'fills', val: fills });
        } else if (args.fillColor !== undefined || args.fillOpacity !== undefined) {
          // Solid color fill
          const fills = [
            {
              fillColor: args.fillColor,
              fillOpacity: args.fillOpacity !== undefined ? args.fillOpacity : 1,
            },
          ];
          changes.operations.push({ type: 'set', attr: 'fills', val: fills });

          // For text shapes, also update the text node fills in content structure
          if (currentShape.type === 'text' && currentShape.content) {
            const updatedContent = JSON.parse(JSON.stringify(currentShape.content)); // Deep clone

            // Update fills in all text nodes
            if (updatedContent.children?.[0]?.children) {
              updatedContent.children[0].children.forEach((paragraph: any) => {
                if (paragraph.children) {
                  paragraph.children.forEach((textNode: any) => {
                    textNode.fills = fills;
                  });
                }
              });
            }

            changes.operations.push({ type: 'set', attr: 'content', val: updatedContent });
          }
        }

        // Text properties for text shapes
        if (currentShape.type === 'text') {
          // Font size
          if (args.fontSize !== undefined) {
            const fontSizeStr = `${args.fontSize}`;
            changes.operations.push({ type: 'set', attr: 'fontSize', val: fontSizeStr });
          }

          // Vertical alignment
          if (args.verticalAlign !== undefined) {
            changes.operations.push({
              type: 'set',
              attr: 'verticalAlign',
              val: args.verticalAlign,
            });
          }

          // Font family
          if (args.fontFamily !== undefined) {
            changes.operations.push({ type: 'set', attr: 'fontFamily', val: args.fontFamily });
          }

          // Font weight
          if (args.fontWeight !== undefined) {
            changes.operations.push({ type: 'set', attr: 'fontWeight', val: args.fontWeight });
          }

          // Font style
          if (args.fontStyle !== undefined) {
            changes.operations.push({ type: 'set', attr: 'fontStyle', val: args.fontStyle });
          }

          // Update content structure with text properties
          if (
            args.fontSize !== undefined ||
            args.textAlign !== undefined ||
            args.fontFamily !== undefined ||
            args.fontWeight !== undefined ||
            args.fontStyle !== undefined ||
            args.textDecoration !== undefined ||
            args.letterSpacing !== undefined ||
            args.lineHeight !== undefined
          ) {
            if (currentShape.content) {
              const updatedContent = JSON.parse(JSON.stringify(currentShape.content)); // Deep clone

              if (updatedContent.children?.[0]?.children) {
                // Update paragraph level properties (textAlign)
                updatedContent.children[0].children.forEach((paragraph: any) => {
                  if (args.textAlign !== undefined) {
                    paragraph.textAlign = args.textAlign;
                  }

                  // Update text node properties
                  if (paragraph.children) {
                    paragraph.children.forEach((textNode: any) => {
                      if (args.fontSize !== undefined) {
                        textNode.fontSize = `${args.fontSize}`;
                      }
                      if (args.fontFamily !== undefined) {
                        textNode.fontFamily = args.fontFamily;
                      }
                      if (args.fontWeight !== undefined) {
                        textNode.fontWeight = args.fontWeight;
                      }
                      if (args.fontStyle !== undefined) {
                        textNode.fontStyle = args.fontStyle;
                      }
                      if (args.textDecoration !== undefined) {
                        textNode.textDecoration = args.textDecoration;
                      }
                      if (args.letterSpacing !== undefined) {
                        textNode.letterSpacing = `${args.letterSpacing}`;
                      }
                      if (args.lineHeight !== undefined) {
                        textNode.lineHeight = args.lineHeight;
                      }
                    });
                  }
                });
              }

              changes.operations.push({ type: 'set', attr: 'content', val: updatedContent });
            }
          }
        }

        // Stroke (border) properties
        if (
          args.strokeColor !== undefined ||
          args.strokeWidth !== undefined ||
          args.strokeOpacity !== undefined
        ) {
          const strokes = [
            {
              strokeColor: args.strokeColor,
              strokeWidth: args.strokeWidth !== undefined ? args.strokeWidth : 1,
              strokeOpacity: args.strokeOpacity !== undefined ? args.strokeOpacity : 1,
              strokeStyle: 'solid' as const,
              strokeAlignment: 'center' as const,
            },
          ];
          changes.operations.push({ type: 'set', attr: 'strokes', val: strokes });
        }

        // Border radius
        if (args.borderRadius !== undefined) {
          // Shorthand: set all corners to same value
          changes.operations.push({ type: 'set', attr: 'r1', val: args.borderRadius });
          changes.operations.push({ type: 'set', attr: 'r2', val: args.borderRadius });
          changes.operations.push({ type: 'set', attr: 'r3', val: args.borderRadius });
          changes.operations.push({ type: 'set', attr: 'r4', val: args.borderRadius });
        } else {
          // Individual corners
          if (args.r1 !== undefined) {
            changes.operations.push({ type: 'set', attr: 'r1', val: args.r1 });
          }
          if (args.r2 !== undefined) {
            changes.operations.push({ type: 'set', attr: 'r2', val: args.r2 });
          }
          if (args.r3 !== undefined) {
            changes.operations.push({ type: 'set', attr: 'r3', val: args.r3 });
          }
          if (args.r4 !== undefined) {
            changes.operations.push({ type: 'set', attr: 'r4', val: args.r4 });
          }
        }

        // Overall opacity
        if (args.opacity !== undefined) {
          changes.operations.push({ type: 'set', attr: 'opacity', val: args.opacity });
        }

        // Shadow properties
        if (
          args.shadowOffsetX !== undefined ||
          args.shadowOffsetY !== undefined ||
          args.shadowBlur !== undefined ||
          args.shadowSpread !== undefined ||
          args.shadowColor !== undefined ||
          args.shadowOpacity !== undefined ||
          args.shadowStyle !== undefined
        ) {
          const shadow = [
            {
              id: uuidv4(),
              style: args.shadowStyle || 'drop-shadow',
              offsetX: args.shadowOffsetX !== undefined ? args.shadowOffsetX : 0,
              offsetY: args.shadowOffsetY !== undefined ? args.shadowOffsetY : 4,
              blur: args.shadowBlur !== undefined ? args.shadowBlur : 10,
              spread: args.shadowSpread !== undefined ? args.shadowSpread : 0,
              hidden: false,
              color: {
                color: args.shadowColor || '#000000',
                opacity: args.shadowOpacity !== undefined ? args.shadowOpacity : 0.25,
              },
            },
          ];
          changes.operations.push({ type: 'set', attr: 'shadow', val: shadow });
        }

        // Blur properties
        if (args.blurValue !== undefined) {
          const blur = {
            id: uuidv4(),
            type: 'layer-blur',
            value: args.blurValue,
            hidden: false,
          };
          changes.operations.push({ type: 'set', attr: 'blur', val: blur });
        }

        // Blend mode
        if (args.blendMode !== undefined) {
          changes.operations.push({ type: 'set', attr: 'blendMode', val: args.blendMode });
        }

        // Flex/Grid + layout-item attrs
        for (const op of layoutModOperations(args)) {
          changes.operations.push(op);
        }

        await penpotClient.applyChanges(args.fileId, [changes]);

        return {
          content: [
            {
              type: 'text',
              text: `Updated shape: ${args.shapeId}`,
            },
          ],
        };
      },
    },

    get_shape_properties: {
      description:
        'Get a shape back from the file, including parentId, layout, child ids, position, and fill size. Call this after set_frame_layout. A missing layout or parentId means the shape is not in Flex.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape ID' },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: { fileId: string; pageId: string; shapeId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        const objects = page.objects || {};
        const shape = objects[args.shapeId];

        if (!shape) {
          throw new Error(`Shape not found: ${args.shapeId}`);
        }

        const attr = (camel: string, kebab: string) =>
          shape[camel] !== undefined && shape[camel] !== null ? shape[camel] : shape[kebab];

        // Extract relevant properties based on shape type.
        // parentId and layout are always present (null when unset) so a pass
        // cannot treat an omitted field as Flex.
        const properties: any = {
          id: args.shapeId,
          name: shape.name,
          type: shape.type,
          x: shape.x ?? 0,
          y: shape.y ?? 0,
          width: shape.width,
          height: shape.height,
          parentId: attr('parentId', 'parent-id') ?? null,
          frameId: attr('frameId', 'frame-id') ?? null,
          layout: attr('layout', 'layout') ?? null,
          layoutFlexDir: attr('layoutFlexDir', 'layout-flex-dir') ?? null,
          layoutGridDir: attr('layoutGridDir', 'layout-grid-dir') ?? null,
          layoutGap: attr('layoutGap', 'layout-gap') ?? null,
          layoutPadding: attr('layoutPadding', 'layout-padding') ?? null,
          layoutAlignItems: attr('layoutAlignItems', 'layout-align-items') ?? null,
          layoutJustifyContent: attr('layoutJustifyContent', 'layout-justify-content') ?? null,
          layoutItemHSizing: attr('layoutItemHSizing', 'layout-item-h-sizing') ?? null,
          layoutItemVSizing: attr('layoutItemVSizing', 'layout-item-v-sizing') ?? null,
          childIds: shape.shapes || [],
        };

        // Position and transform
        if (shape.rotation !== undefined) {
          properties.rotation = shape.rotation;
        }
        if (shape.flipX !== undefined) {
          properties.flipX = shape.flipX;
        }
        if (shape.flipY !== undefined) {
          properties.flipY = shape.flipY;
        }

        // Fill properties
        if (shape.fills && shape.fills.length > 0) {
          const fill = shape.fills[0];
          properties.fillColor = fill.fillColor;
          properties.fillOpacity = fill.fillOpacity;

          // Gradient
          if (fill.fillColorGradient) {
            properties.gradient = {
              type: fill.fillColorGradient.type,
              startX: fill.fillColorGradient.startX,
              startY: fill.fillColorGradient.startY,
              endX: fill.fillColorGradient.endX,
              endY: fill.fillColorGradient.endY,
              width: fill.fillColorGradient.width,
              stops: fill.fillColorGradient.stops,
            };
          }

          // Fill image
          if (fill.fillImage) {
            properties.fillImage = {
              id: fill.fillImage.id,
              name: fill.fillImage.name,
              width: fill.fillImage.width,
              height: fill.fillImage.height,
              mtype: fill.fillImage.mtype,
              keepAspectRatio: fill.fillImage.keepAspectRatio,
            };
          }
        }

        // Stroke properties
        if (shape.strokes && shape.strokes.length > 0) {
          const stroke = shape.strokes[0];
          properties.stroke = {
            color: stroke.strokeColor,
            width: stroke.strokeWidth,
            opacity: stroke.strokeOpacity,
            style: stroke.strokeStyle,
            alignment: stroke.strokeAlignment,
          };
        }

        // Border radius
        if (shape.r1 !== undefined) {
          properties.r1 = shape.r1;
        }
        if (shape.r2 !== undefined) {
          properties.r2 = shape.r2;
        }
        if (shape.r3 !== undefined) {
          properties.r3 = shape.r3;
        }
        if (shape.r4 !== undefined) {
          properties.r4 = shape.r4;
        }

        // Opacity
        if (shape.opacity !== undefined) {
          properties.opacity = shape.opacity;
        }

        // Shadow
        if (shape.shadow && shape.shadow.length > 0) {
          properties.shadows = shape.shadow.map((s: any) => ({
            style: s.style,
            offsetX: s.offsetX,
            offsetY: s.offsetY,
            blur: s.blur,
            spread: s.spread,
            color: s.color?.color,
            opacity: s.color?.opacity,
            hidden: s.hidden,
          }));
        }

        // Blur
        if (shape.blur) {
          properties.blur = {
            type: shape.blur.type,
            value: shape.blur.value,
            hidden: shape.blur.hidden,
          };
        }

        // Blend mode
        if (shape.blendMode !== undefined) {
          properties.blendMode = shape.blendMode;
        }

        // Text-specific properties
        if (shape.type === 'text') {
          properties.text = {
            fontSize: shape.fontSize,
            fontFamily: shape.fontFamily,
            fontWeight: shape.fontWeight,
            fontStyle: shape.fontStyle,
            verticalAlign: shape.verticalAlign,
            textDecoration: shape.textDecoration,
            letterSpacing: shape.letterSpacing,
            lineHeight: shape.lineHeight,
          };

          // Extract text content and alignment from content structure
          if (shape.content) {
            const textContent: string[] = [];
            const textAlignments: string[] = [];

            if (shape.content.children?.[0]?.children) {
              shape.content.children[0].children.forEach((paragraph: any) => {
                if (paragraph.textAlign) {
                  textAlignments.push(paragraph.textAlign);
                }
                if (paragraph.children) {
                  paragraph.children.forEach((textNode: any) => {
                    if (textNode.text) {
                      textContent.push(textNode.text);
                    }
                  });
                }
              });
            }

            properties.text.content = textContent.join('');
            if (textAlignments.length > 0) {
              properties.text.textAlign = textAlignments[0]; // First paragraph alignment
            }
          }
        }

        // Path-specific properties
        if (shape.type === 'path' && shape.content) {
          properties.pathContent = shape.content;
        }

        return {
          content: [
            {
              type: 'text',
              text: `Shape properties for: ${shape.name} (${shape.type})`,
            },
            {
              type: 'text',
              text: JSON.stringify(properties, null, 2),
            },
          ],
        };
      },
    },

    delete_shape: {
      description: 'Delete a shape from the page',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape ID' },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: { fileId: string; pageId: string; shapeId: string }) => {
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'del-obj',
            id: args.shapeId,
            pageId: args.pageId,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Deleted shape: ${args.shapeId}`,
            },
          ],
        };
      },
    },
  };
}
