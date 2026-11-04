/**
 * Shape Tools - Shape creation and manipulation
 */

import { PenpotClient } from '../penpot-client.js';
import { v4 as uuidv4 } from 'uuid';
import {
  resolveParentContext,
  buildLayoutItemAttrs,
  buildFrameLayoutAttrs,
  parentIdSchemaProp,
  layoutItemSchemaProps,
  frameLayoutSchemaProps,
} from '../layout-helpers.js';

/**
 * Helper to create required geometric fields for shapes
 */
function createShapeGeometry(x: number, y: number, width: number, height: number) {
  return {
    selrect: {
      x,
      y,
      width,
      height,
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
    },
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    transformInverse: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  };
}

export function createShapeTools(penpotClient: PenpotClient) {
  return {
    create_rectangle: {
      description:
        'Create a rectangle shape with colors, gradients, images, borders, rounded corners, shadows, blur, and blend modes',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          x: { type: 'number', description: 'X position', default: 0 },
          y: { type: 'number', description: 'Y position', default: 0 },
          width: { type: 'number', description: 'Width', default: 100 },
          height: { type: 'number', description: 'Height', default: 100 },
          name: { type: 'string', description: 'Shape name', default: 'Rectangle' },
          fillColor: { type: 'string', description: 'Fill color (HEX, e.g., "#FF0000")' },
          fillOpacity: { type: 'number', description: 'Fill opacity (0-1)', default: 1 },
          gradientType: { type: 'string', description: 'Gradient type: "linear" or "radial"' },
          gradientStartX: {
            type: 'number',
            description: 'Gradient start X (0-1 normalized)',
            default: 0,
          },
          gradientStartY: {
            type: 'number',
            description: 'Gradient start Y (0-1 normalized)',
            default: 0,
          },
          gradientEndX: {
            type: 'number',
            description: 'Gradient end X (0-1 normalized)',
            default: 1,
          },
          gradientEndY: {
            type: 'number',
            description: 'Gradient end Y (0-1 normalized)',
            default: 1,
          },
          gradientStops: {
            type: 'string',
            description:
              'Gradient stops as JSON array, e.g., \'[{"color":"#667eea","opacity":1,"offset":0},{"color":"#764ba2","opacity":1,"offset":1}]\'',
          },
          fillImageId: { type: 'string', description: 'Image media ID (from upload_file_media)' },
          fillImageName: { type: 'string', description: 'Image name' },
          fillImageWidth: { type: 'number', description: 'Image width in pixels' },
          fillImageHeight: { type: 'number', description: 'Image height in pixels' },
          fillImageMtype: { type: 'string', description: 'Image MIME type', default: 'image/png' },
          fillImageKeepAspectRatio: {
            type: 'boolean',
            description: 'Keep image aspect ratio',
            default: true,
          },
          strokeColor: { type: 'string', description: 'Stroke color (HEX)' },
          strokeWidth: { type: 'number', description: 'Stroke width in pixels', default: 1 },
          strokeOpacity: { type: 'number', description: 'Stroke opacity (0-1)', default: 1 },
          r1: { type: 'number', description: 'Top-left corner radius', default: 0 },
          r2: { type: 'number', description: 'Top-right corner radius', default: 0 },
          r3: { type: 'number', description: 'Bottom-right corner radius', default: 0 },
          r4: { type: 'number', description: 'Bottom-left corner radius', default: 0 },
          borderRadius: { type: 'number', description: 'All corners radius (shorthand for r1-r4)' },
          opacity: { type: 'number', description: 'Overall shape opacity (0-1)', default: 1 },
          shadowColor: {
            type: 'string',
            description: 'Shadow color (HEX, e.g., "#000000")',
            default: '#000000',
          },
          shadowOffsetX: { type: 'number', description: 'Shadow X offset in pixels', default: 0 },
          shadowOffsetY: { type: 'number', description: 'Shadow Y offset in pixels', default: 4 },
          shadowBlur: { type: 'number', description: 'Shadow blur radius in pixels', default: 10 },
          shadowSpread: { type: 'number', description: 'Shadow spread in pixels', default: 0 },
          shadowOpacity: { type: 'number', description: 'Shadow opacity (0-1)', default: 0.25 },
          shadowStyle: {
            type: 'string',
            description: 'Shadow style: "drop-shadow" or "inner-shadow"',
            default: 'drop-shadow',
          },
          blurValue: {
            type: 'number',
            description: 'Blur intensity in pixels (for glassmorphism effect)',
          },
          blendMode: {
            type: 'string',
            description:
              'Blend mode: "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"',
            default: 'normal',
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const shapeId = uuidv4();
        const x = args.x || 0;
        const y = args.y || 0;
        const width = args.width || 100;
        const height = args.height || 100;

        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const geometry = createShapeGeometry(x, y, width, height);

        // Build fills array - priority: gradient > image > solid color
        let fills: any = undefined;

        if (args.gradientType && args.gradientStops) {
          // Gradient fill
          const stops = JSON.parse(args.gradientStops);
          fills = [
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
        } else if (args.fillImageId) {
          // Image fill
          fills = [
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
        } else {
          // Solid color fill (fillColor is required)
          if (!args.fillColor) {
            throw new Error(
              'fillColor is required. Please specify a fill color (e.g., "#FF0000"), or use gradientType/gradientStops for gradient fills, or use fillImageId for image fills.'
            );
          }
          fills = [
            {
              fillColor: args.fillColor,
              fillOpacity: args.fillOpacity !== undefined ? args.fillOpacity : 1,
            },
          ];
        }

        // Build strokes array if strokeColor is provided
        const strokes = args.strokeColor
          ? [
              {
                strokeColor: args.strokeColor,
                strokeWidth: args.strokeWidth || 1,
                strokeOpacity: args.strokeOpacity !== undefined ? args.strokeOpacity : 1,
                strokeStyle: 'solid' as const,
                strokeAlignment: 'center' as const,
              },
            ]
          : undefined;

        // Handle border radius (borderRadius shorthand overrides individual r1-r4)
        const borderRadius = args.borderRadius !== undefined ? args.borderRadius : undefined;
        const r1 = borderRadius !== undefined ? borderRadius : args.r1 || 0;
        const r2 = borderRadius !== undefined ? borderRadius : args.r2 || 0;
        const r3 = borderRadius !== undefined ? borderRadius : args.r3 || 0;
        const r4 = borderRadius !== undefined ? borderRadius : args.r4 || 0;

        // Build shadow array if shadow properties are provided
        const shadow =
          args.shadowOffsetX !== undefined ||
          args.shadowOffsetY !== undefined ||
          args.shadowBlur !== undefined
            ? [
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
              ]
            : undefined;

        // Build blur object if blurValue is provided
        const blur =
          args.blurValue !== undefined
            ? {
                id: uuidv4(),
                type: 'layer-blur',
                value: args.blurValue,
                hidden: false,
              }
            : undefined;

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: shapeId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: shapeId,
              type: 'rect',
              name: args.name || 'Rectangle',
              x,
              y,
              width,
              height,
              parentId,
              frameId,
              ...geometry,
              ...layoutItem,
              ...(fills && { fills }),
              ...(strokes && { strokes }),
              ...(r1 && { r1 }),
              ...(r2 && { r2 }),
              ...(r3 && { r3 }),
              ...(r4 && { r4 }),
              ...(args.opacity !== undefined && { opacity: args.opacity }),
              ...(shadow && { shadow }),
              ...(blur && { blur }),
              ...(args.blendMode && args.blendMode !== 'normal' && { blendMode: args.blendMode }),
            },
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created rectangle: ${args.name || 'Rectangle'} (ID: ${shapeId})`,
            },
          ],
        };
      },
    },

    create_circle: {
      description:
        'Create a circle shape with colors, gradients, images, borders, shadows, blur, and blend modes',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          x: { type: 'number', description: 'X position', default: 0 },
          y: { type: 'number', description: 'Y position', default: 0 },
          radius: { type: 'number', description: 'Radius', default: 50 },
          name: { type: 'string', description: 'Shape name', default: 'Circle' },
          fillColor: { type: 'string', description: 'Fill color (HEX, e.g., "#FF0000")' },
          fillOpacity: { type: 'number', description: 'Fill opacity (0-1)', default: 1 },
          gradientType: { type: 'string', description: 'Gradient type: "linear" or "radial"' },
          gradientStartX: {
            type: 'number',
            description: 'Gradient start X (0-1 normalized)',
            default: 0,
          },
          gradientStartY: {
            type: 'number',
            description: 'Gradient start Y (0-1 normalized)',
            default: 0,
          },
          gradientEndX: {
            type: 'number',
            description: 'Gradient end X (0-1 normalized)',
            default: 1,
          },
          gradientEndY: {
            type: 'number',
            description: 'Gradient end Y (0-1 normalized)',
            default: 1,
          },
          gradientStops: {
            type: 'string',
            description:
              'Gradient stops as JSON array, e.g., \'[{"color":"#667eea","opacity":1,"offset":0},{"color":"#764ba2","opacity":1,"offset":1}]\'',
          },
          fillImageId: { type: 'string', description: 'Image media ID (from upload_file_media)' },
          fillImageName: { type: 'string', description: 'Image name' },
          fillImageWidth: { type: 'number', description: 'Image width in pixels' },
          fillImageHeight: { type: 'number', description: 'Image height in pixels' },
          fillImageMtype: { type: 'string', description: 'Image MIME type', default: 'image/png' },
          fillImageKeepAspectRatio: {
            type: 'boolean',
            description: 'Keep image aspect ratio',
            default: true,
          },
          strokeColor: { type: 'string', description: 'Stroke color (HEX)' },
          strokeWidth: { type: 'number', description: 'Stroke width in pixels', default: 1 },
          strokeOpacity: { type: 'number', description: 'Stroke opacity (0-1)', default: 1 },
          opacity: { type: 'number', description: 'Overall shape opacity (0-1)', default: 1 },
          shadowColor: {
            type: 'string',
            description: 'Shadow color (HEX, e.g., "#000000")',
            default: '#000000',
          },
          shadowOffsetX: { type: 'number', description: 'Shadow X offset in pixels', default: 0 },
          shadowOffsetY: { type: 'number', description: 'Shadow Y offset in pixels', default: 4 },
          shadowBlur: { type: 'number', description: 'Shadow blur radius in pixels', default: 10 },
          shadowSpread: { type: 'number', description: 'Shadow spread in pixels', default: 0 },
          shadowOpacity: { type: 'number', description: 'Shadow opacity (0-1)', default: 0.25 },
          shadowStyle: {
            type: 'string',
            description: 'Shadow style: "drop-shadow" or "inner-shadow"',
            default: 'drop-shadow',
          },
          blurValue: {
            type: 'number',
            description: 'Blur intensity in pixels (for glassmorphism effect)',
          },
          blendMode: {
            type: 'string',
            description: 'Blend mode: "normal", "multiply", "screen", "overlay", etc.',
            default: 'normal',
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const shapeId = uuidv4();
        const x = args.x || 0;
        const y = args.y || 0;
        const radius = args.radius || 50;
        const width = radius * 2;
        const height = radius * 2;

        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const geometry = createShapeGeometry(x, y, width, height);

        // Build fills array - priority: gradient > image > solid color
        let fills: any = undefined;

        if (args.gradientType && args.gradientStops) {
          // Gradient fill
          const stops = JSON.parse(args.gradientStops);
          fills = [
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
        } else if (args.fillImageId) {
          // Image fill
          fills = [
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
        } else {
          // Solid color fill (fillColor is required)
          if (!args.fillColor) {
            throw new Error(
              'fillColor is required. Please specify a fill color (e.g., "#FF0000"), or use gradientType/gradientStops for gradient fills, or use fillImageId for image fills.'
            );
          }
          fills = [
            {
              fillColor: args.fillColor,
              fillOpacity: args.fillOpacity !== undefined ? args.fillOpacity : 1,
            },
          ];
        }

        // Build strokes array if strokeColor is provided
        const strokes = args.strokeColor
          ? [
              {
                strokeColor: args.strokeColor,
                strokeWidth: args.strokeWidth || 1,
                strokeOpacity: args.strokeOpacity !== undefined ? args.strokeOpacity : 1,
                strokeStyle: 'solid' as const,
                strokeAlignment: 'center' as const,
              },
            ]
          : undefined;

        // Build shadow array if shadow properties are provided
        const shadow =
          args.shadowOffsetX !== undefined ||
          args.shadowOffsetY !== undefined ||
          args.shadowBlur !== undefined
            ? [
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
              ]
            : undefined;

        // Build blur object if blurValue is provided
        const blur =
          args.blurValue !== undefined
            ? {
                id: uuidv4(),
                type: 'layer-blur',
                value: args.blurValue,
                hidden: false,
              }
            : undefined;

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: shapeId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: shapeId,
              type: 'circle',
              name: args.name || 'Circle',
              x,
              y,
              width,
              height,
              parentId,
              frameId,
              ...geometry,
              ...layoutItem,
              ...(fills && { fills }),
              ...(strokes && { strokes }),
              ...(args.opacity !== undefined && { opacity: args.opacity }),
              ...(shadow && { shadow }),
              ...(blur && { blur }),
              ...(args.blendMode && args.blendMode !== 'normal' && { blendMode: args.blendMode }),
            },
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created circle: ${args.name || 'Circle'} (ID: ${shapeId})`,
            },
          ],
        };
      },
    },

    create_text: {
      description:
        'Create a text shape with color, styling, alignment, shadows, blur effects, and blend modes',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          x: { type: 'number', description: 'X position', default: 0 },
          y: { type: 'number', description: 'Y position', default: 0 },
          text: { type: 'string', description: 'Text content', default: 'Text' },
          fontSize: { type: 'number', description: 'Font size', default: 16 },
          name: { type: 'string', description: 'Shape name' },
          textAlign: {
            type: 'string',
            description: 'Text alignment: "left", "center", "right", or "justify"',
            default: 'left',
          },
          verticalAlign: {
            type: 'string',
            description: 'Vertical alignment: "top", "center", or "bottom"',
            default: 'top',
          },
          fontFamily: { type: 'string', description: 'Font family name', default: 'Work Sans' },
          fontWeight: {
            type: 'string',
            description: 'Font weight: "normal", "bold", "100"-"900"',
            default: 'normal',
          },
          fontStyle: {
            type: 'string',
            description: 'Font style: "normal" or "italic"',
            default: 'normal',
          },
          textDecoration: {
            type: 'string',
            description: 'Text decoration: "none", "underline", "line-through"',
            default: 'none',
          },
          letterSpacing: { type: 'number', description: 'Letter spacing in pixels', default: 0 },
          lineHeight: { type: 'number', description: 'Line height multiplier', default: 1.2 },
          fillColor: {
            type: 'string',
            description: 'Text color (HEX, e.g., "#000000")',
            default: '#000000',
          },
          fillOpacity: { type: 'number', description: 'Text opacity (0-1)', default: 1 },
          opacity: { type: 'number', description: 'Overall shape opacity (0-1)', default: 1 },
          shadowColor: {
            type: 'string',
            description: 'Shadow color (HEX, e.g., "#000000")',
            default: '#000000',
          },
          shadowOffsetX: { type: 'number', description: 'Shadow X offset in pixels', default: 0 },
          shadowOffsetY: { type: 'number', description: 'Shadow Y offset in pixels', default: 2 },
          shadowBlur: { type: 'number', description: 'Shadow blur radius in pixels', default: 4 },
          shadowSpread: { type: 'number', description: 'Shadow spread in pixels', default: 0 },
          shadowOpacity: { type: 'number', description: 'Shadow opacity (0-1)', default: 0.5 },
          shadowStyle: {
            type: 'string',
            description: 'Shadow style: "drop-shadow" or "inner-shadow"',
            default: 'drop-shadow',
          },
          blurValue: { type: 'number', description: 'Blur intensity in pixels' },
          blendMode: {
            type: 'string',
            description: 'Blend mode: "normal", "multiply", "screen", "overlay", etc.',
            default: 'normal',
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const shapeId = uuidv4();
        const text = args.text || 'Text';
        const x = args.x || 0;
        const y = args.y || 0;
        const fontSize = args.fontSize || 16;

        // Estimate text dimensions
        const width = text.length * fontSize * 0.6;
        const height = fontSize * 1.5;

        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const geometry = createShapeGeometry(x, y, width, height);

        // Prepare text properties
        const fillColor = args.fillColor || '#000000';
        const fillOpacity = args.fillOpacity !== undefined ? args.fillOpacity : 1;
        const fontSizeStr = `${fontSize}`;
        const fontFamily = args.fontFamily || 'Work Sans';
        const fontWeight = args.fontWeight || 'normal';
        const fontStyle = args.fontStyle || 'normal';
        const textDecoration = args.textDecoration || 'none';
        const letterSpacing = args.letterSpacing || 0;
        const lineHeight = args.lineHeight || 1.2;
        const textAlign = args.textAlign || 'left';
        const verticalAlign = args.verticalAlign || 'top';

        // Build fills array for text color (at shape level)
        const fills = [
          {
            fillColor,
            fillOpacity,
          },
        ];

        // Build shadow array if shadow properties are provided
        const shadow =
          args.shadowOffsetX !== undefined ||
          args.shadowOffsetY !== undefined ||
          args.shadowBlur !== undefined
            ? [
                {
                  id: uuidv4(),
                  style: args.shadowStyle || 'drop-shadow',
                  offsetX: args.shadowOffsetX !== undefined ? args.shadowOffsetX : 0,
                  offsetY: args.shadowOffsetY !== undefined ? args.shadowOffsetY : 2,
                  blur: args.shadowBlur !== undefined ? args.shadowBlur : 4,
                  spread: args.shadowSpread !== undefined ? args.shadowSpread : 0,
                  hidden: false,
                  color: {
                    color: args.shadowColor || '#000000',
                    opacity: args.shadowOpacity !== undefined ? args.shadowOpacity : 0.5,
                  },
                },
              ]
            : undefined;

        // Build blur object if blurValue is provided
        const blur =
          args.blurValue !== undefined
            ? {
                id: uuidv4(),
                type: 'layer-blur',
                value: args.blurValue,
                hidden: false,
              }
            : undefined;

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: shapeId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: shapeId,
              type: 'text',
              name: args.name || text,
              x,
              y,
              width,
              height,
              parentId,
              frameId,
              content: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph-set',
                    children: [
                      {
                        type: 'paragraph',
                        ...(textAlign && { textAlign }),
                        children: [
                          {
                            text,
                            fills: [
                              {
                                fillColor,
                                fillOpacity,
                              },
                            ],
                            fontSize: fontSizeStr,
                            fontFamily,
                            fontWeight,
                            fontStyle,
                            textDecoration,
                            letterSpacing: `${letterSpacing}`,
                            lineHeight,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              fontSize: fontSizeStr,
              fontFamily,
              fontWeight,
              fontStyle,
              fills,
              verticalAlign,
              ...geometry,
              ...layoutItem,
              ...(args.opacity !== undefined && { opacity: args.opacity }),
              ...(shadow && { shadow }),
              ...(blur && { blur }),
              ...(args.blendMode && args.blendMode !== 'normal' && { blendMode: args.blendMode }),
            },
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created text: ${args.name || text} (ID: ${shapeId}) with ${textAlign} alignment`,
            },
          ],
        };
      },
    },

    create_frame: {
      description:
        'Create a frame shape (container for other shapes) with colors, gradients, images, borders, shadows, blur, and blend modes',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          ...frameLayoutSchemaProps,
          x: { type: 'number', description: 'X position', default: 0 },
          y: { type: 'number', description: 'Y position', default: 0 },
          width: { type: 'number', description: 'Width', default: 300 },
          height: { type: 'number', description: 'Height', default: 300 },
          name: { type: 'string', description: 'Frame name', default: 'Frame' },
          fillColor: { type: 'string', description: 'Background color (HEX, e.g., "#FFFFFF")' },
          fillOpacity: { type: 'number', description: 'Background opacity (0-1)', default: 1 },
          gradientType: { type: 'string', description: 'Gradient type: "linear" or "radial"' },
          gradientStartX: {
            type: 'number',
            description: 'Gradient start X (0-1 normalized)',
            default: 0,
          },
          gradientStartY: {
            type: 'number',
            description: 'Gradient start Y (0-1 normalized)',
            default: 0,
          },
          gradientEndX: {
            type: 'number',
            description: 'Gradient end X (0-1 normalized)',
            default: 1,
          },
          gradientEndY: {
            type: 'number',
            description: 'Gradient end Y (0-1 normalized)',
            default: 1,
          },
          gradientStops: {
            type: 'string',
            description:
              'Gradient stops as JSON array, e.g., \'[{"color":"#667eea","opacity":1,"offset":0},{"color":"#764ba2","opacity":1,"offset":1}]\'',
          },
          fillImageId: { type: 'string', description: 'Image media ID (from upload_file_media)' },
          fillImageName: { type: 'string', description: 'Image name' },
          fillImageWidth: { type: 'number', description: 'Image width in pixels' },
          fillImageHeight: { type: 'number', description: 'Image height in pixels' },
          fillImageMtype: { type: 'string', description: 'Image MIME type', default: 'image/png' },
          fillImageKeepAspectRatio: {
            type: 'boolean',
            description: 'Keep image aspect ratio',
            default: true,
          },
          strokeColor: { type: 'string', description: 'Border color (HEX)' },
          strokeWidth: { type: 'number', description: 'Border width in pixels', default: 1 },
          strokeOpacity: { type: 'number', description: 'Border opacity (0-1)', default: 1 },
          r1: { type: 'number', description: 'Top-left corner radius', default: 0 },
          r2: { type: 'number', description: 'Top-right corner radius', default: 0 },
          r3: { type: 'number', description: 'Bottom-right corner radius', default: 0 },
          r4: { type: 'number', description: 'Bottom-left corner radius', default: 0 },
          borderRadius: { type: 'number', description: 'All corners radius (shorthand for r1-r4)' },
          opacity: { type: 'number', description: 'Overall frame opacity (0-1)', default: 1 },
          shadowColor: {
            type: 'string',
            description: 'Shadow color (HEX, e.g., "#000000")',
            default: '#000000',
          },
          shadowOffsetX: { type: 'number', description: 'Shadow X offset in pixels', default: 0 },
          shadowOffsetY: { type: 'number', description: 'Shadow Y offset in pixels', default: 4 },
          shadowBlur: { type: 'number', description: 'Shadow blur radius in pixels', default: 10 },
          shadowSpread: { type: 'number', description: 'Shadow spread in pixels', default: 0 },
          shadowOpacity: { type: 'number', description: 'Shadow opacity (0-1)', default: 0.25 },
          shadowStyle: {
            type: 'string',
            description: 'Shadow style: "drop-shadow" or "inner-shadow"',
            default: 'drop-shadow',
          },
          blurValue: {
            type: 'number',
            description: 'Blur intensity in pixels (for glassmorphism effect)',
          },
          blendMode: {
            type: 'string',
            description: 'Blend mode: "normal", "multiply", "screen", "overlay", etc.',
            default: 'normal',
          },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const frameId = uuidv4();
        const x = args.x || 0;
        const y = args.y || 0;
        const width = args.width || 300;
        const height = args.height || 300;

        const { parentId, frameId: containingFrameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const frameLayout = buildFrameLayoutAttrs(args);
        const geometry = createShapeGeometry(x, y, width, height);

        // Build fills array - priority: gradient > image > solid color
        let fills: any = undefined;

        if (args.gradientType && args.gradientStops) {
          // Gradient fill
          const stops = JSON.parse(args.gradientStops);
          fills = [
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
        } else if (args.fillImageId) {
          // Image fill
          fills = [
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
        } else {
          // Solid color fill (fillColor is required)
          if (!args.fillColor) {
            throw new Error(
              'fillColor is required. Please specify a fill color (e.g., "#FF0000"), or use gradientType/gradientStops for gradient fills, or use fillImageId for image fills.'
            );
          }
          fills = [
            {
              fillColor: args.fillColor,
              fillOpacity: args.fillOpacity !== undefined ? args.fillOpacity : 1,
            },
          ];
        }

        // Build strokes array if strokeColor is provided
        const strokes = args.strokeColor
          ? [
              {
                strokeColor: args.strokeColor,
                strokeWidth: args.strokeWidth || 1,
                strokeOpacity: args.strokeOpacity !== undefined ? args.strokeOpacity : 1,
                strokeStyle: 'solid' as const,
                strokeAlignment: 'center' as const,
              },
            ]
          : undefined;

        // Handle border radius (borderRadius shorthand overrides individual r1-r4)
        const borderRadius = args.borderRadius !== undefined ? args.borderRadius : undefined;
        const r1 = borderRadius !== undefined ? borderRadius : args.r1 || 0;
        const r2 = borderRadius !== undefined ? borderRadius : args.r2 || 0;
        const r3 = borderRadius !== undefined ? borderRadius : args.r3 || 0;
        const r4 = borderRadius !== undefined ? borderRadius : args.r4 || 0;

        // Build shadow array if shadow properties are provided
        const shadow =
          args.shadowOffsetX !== undefined ||
          args.shadowOffsetY !== undefined ||
          args.shadowBlur !== undefined
            ? [
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
              ]
            : undefined;

        // Build blur object if blurValue is provided
        const blur =
          args.blurValue !== undefined
            ? {
                id: uuidv4(),
                type: 'layer-blur',
                value: args.blurValue,
                hidden: false,
              }
            : undefined;

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: frameId,
            pageId: args.pageId,
            frameId: containingFrameId,
            parentId,
            obj: {
              id: frameId,
              type: 'frame',
              name: args.name || 'Frame',
              x,
              y,
              width,
              height,
              parentId,
              frameId: containingFrameId,
              shapes: [], // Empty shapes array for new frame
              ...geometry,
              ...frameLayout,
              ...layoutItem,
              ...(fills && { fills }),
              ...(strokes && { strokes }),
              ...(r1 && { r1 }),
              ...(r2 && { r2 }),
              ...(r3 && { r3 }),
              ...(r4 && { r4 }),
              ...(args.opacity !== undefined && { opacity: args.opacity }),
              ...(shadow && { shadow }),
              ...(blur && { blur }),
              ...(args.blendMode && args.blendMode !== 'normal' && { blendMode: args.blendMode }),
            },
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created frame: ${args.name || 'Frame'} (ID: ${frameId})`,
            },
          ],
        };
      },
    },
  };
}
