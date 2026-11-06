/**
 * Shape Tools - Shape creation and manipulation
 */

import { PenpotClient } from '../penpot-client.js';
import { coverImageFill } from '../board-audit.js';
import { v4 as uuidv4 } from 'uuid';
import {
  resolveParentContext,
  buildLayoutItemAttrs,
  buildFrameLayoutAttrs,
  parentIdSchemaProp,
  layoutItemSchemaProps,
  frameLayoutSchemaProps,
} from '../layout-helpers.js';
import {
  boundsFromPathContent,
  createShapeGeometry as sharedGeometry,
  pathContentFromSvgD,
  type PathSegment,
} from '../shape-builders.js';

/**
 * Helper to create required geometric fields for shapes
 */
function imageFill(
  args: {
    fillImageId: string;
    fillImageName?: string;
    fillImageWidth?: number;
    fillImageHeight?: number;
    fillImageMtype?: string;
    fillImageKeepAspectRatio?: boolean;
  },
  shapeWidth: number,
  shapeHeight: number
) {
  const keepAspectRatio =
    args.fillImageKeepAspectRatio !== undefined ? args.fillImageKeepAspectRatio : true;
  const size = coverImageFill(
    shapeWidth,
    shapeHeight,
    args.fillImageWidth,
    args.fillImageHeight,
    keepAspectRatio
  );
  return {
    fillImage: {
      width: size.width,
      height: size.height,
      mtype: args.fillImageMtype || 'image/png',
      id: args.fillImageId,
      name: args.fillImageName || 'image',
      keepAspectRatio,
    },
  };
}

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
        'Create a rectangle. Image fills are scaled to cover the shape. Do not stack two shapes on the same spot; put siblings in a flex frame. Call audit_board after a screen.',
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
          fillImageWidth: {
            type: 'number',
            description:
              'Source image width in pixels. The fill is scaled to cover this shape. A smaller fill paints the photo in the corner.',
          },
          fillImageHeight: {
            type: 'number',
            description: 'Source image height in pixels. Paired with fillImageWidth.',
          },
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
          fills = [imageFill(args, width, height)];
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
          fillImageWidth: {
            type: 'number',
            description:
              'Source image width in pixels. The fill is scaled to cover this shape. A smaller fill paints the photo in the corner.',
          },
          fillImageHeight: {
            type: 'number',
            description: 'Source image height in pixels. Paired with fillImageWidth.',
          },
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
          fills = [imageFill(args, width, height)];
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
          growType: {
            type: 'string',
            description: 'Text box sizing: "auto-width" | "auto-height" | "fixed"',
            default: 'auto-width',
          },
          width: { type: 'number', description: 'Fixed width when growType is fixed/auto-height' },
          height: { type: 'number', description: 'Fixed height when growType is fixed' },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        const shapeId = uuidv4();
        const text = args.text || 'Text';
        const x = args.x || 0;
        const y = args.y || 0;
        const fontSize = args.fontSize || 16;

        const growType = args.growType || 'auto-width';
        // Estimate text dimensions (override with explicit width/height when fixed)
        const width = args.width !== undefined ? args.width : text.length * fontSize * 0.6;
        const height =
          args.height !== undefined ? args.height : fontSize * (args.lineHeight || 1.5);

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
              growType,
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
          fillImageWidth: {
            type: 'number',
            description:
              'Source image width in pixels. The fill is scaled to cover this shape. A smaller fill paints the photo in the corner.',
          },
          fillImageHeight: {
            type: 'number',
            description: 'Source image height in pixels. Paired with fillImageWidth.',
          },
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
          fills = [imageFill(args, width, height)];
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

    create_path: {
      description:
        'Create a vector path. Pass SVG path `d` (e.g. "M0 0 L100 0 L50 80 Z") or a JSON content array of Penpot segments.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          d: { type: 'string', description: 'SVG path d attribute' },
          content: {
            type: 'string',
            description: 'JSON array of {command, params?} Penpot path segments',
          },
          name: { type: 'string', default: 'Path' },
          fillColor: { type: 'string' },
          fillOpacity: { type: 'number', default: 1 },
          strokeColor: { type: 'string' },
          strokeWidth: { type: 'number', default: 1 },
          strokeOpacity: { type: 'number', default: 1 },
          opacity: { type: 'number', default: 1 },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: any) => {
        let content: PathSegment[];
        if (args.d) {
          content = pathContentFromSvgD(args.d);
        } else if (args.content) {
          content = JSON.parse(args.content);
        } else {
          throw new Error('Provide SVG path d or content JSON');
        }
        const bounds = boundsFromPathContent(content);
        const shapeId = uuidv4();
        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const geometry = sharedGeometry(bounds.x, bounds.y, bounds.width, bounds.height);
        const fills = args.fillColor
          ? [{ fillColor: args.fillColor, fillOpacity: args.fillOpacity ?? 1 }]
          : undefined;
        const strokes = args.strokeColor
          ? [
              {
                strokeColor: args.strokeColor,
                strokeWidth: args.strokeWidth || 1,
                strokeOpacity: args.strokeOpacity ?? 1,
                strokeStyle: 'solid',
                strokeAlignment: 'center',
              },
            ]
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
              type: 'path',
              name: args.name || 'Path',
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              parentId,
              frameId,
              content,
              ...geometry,
              ...layoutItem,
              ...(fills && { fills }),
              ...(strokes && { strokes }),
              ...(args.opacity !== undefined && { opacity: args.opacity }),
            },
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created path ${args.name || 'Path'} (ID: ${shapeId})`,
            },
          ],
        };
      },
    },

    create_svg: {
      description:
        'Create an svg-raw shape from an SVG markup string. Prefer create_path when you only have a path d.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          svg: { type: 'string', description: 'Full SVG markup' },
          x: { type: 'number', default: 0 },
          y: { type: 'number', default: 0 },
          width: { type: 'number', default: 100 },
          height: { type: 'number', default: 100 },
          name: { type: 'string', default: 'SVG' },
        },
        required: ['fileId', 'pageId', 'svg'],
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
        const geometry = sharedGeometry(x, y, width, height);
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: shapeId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: shapeId,
              type: 'svg-raw',
              name: args.name || 'SVG',
              x,
              y,
              width,
              height,
              parentId,
              frameId,
              content: args.svg,
              ...geometry,
              ...layoutItem,
            },
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: `Created SVG ${args.name || 'SVG'} (ID: ${shapeId})`,
            },
          ],
        };
      },
    },

    create_image: {
      description:
        'Create an image shape from a media object id (from upload_media or create_media_from_url). Prefer this over a rectangle with an image fill when the photo is the shape.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          ...parentIdSchemaProp,
          ...layoutItemSchemaProps,
          mediaId: { type: 'string', description: 'File media object id' },
          x: { type: 'number', default: 0 },
          y: { type: 'number', default: 0 },
          width: { type: 'number' },
          height: { type: 'number' },
          name: { type: 'string', default: 'Image' },
          mtype: { type: 'string', default: 'image/png' },
          keepAspectRatio: { type: 'boolean', default: true },
        },
        required: ['fileId', 'pageId', 'mediaId', 'width', 'height'],
      },
      handler: async (args: any) => {
        const shapeId = uuidv4();
        const x = args.x || 0;
        const y = args.y || 0;
        const width = args.width;
        const height = args.height;
        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );
        const layoutItem = buildLayoutItemAttrs(args);
        const geometry = sharedGeometry(x, y, width, height);
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: shapeId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: shapeId,
              type: 'image',
              name: args.name || 'Image',
              x,
              y,
              width,
              height,
              parentId,
              frameId,
              metadata: {
                id: args.mediaId,
                width,
                height,
                mtype: args.mtype || 'image/png',
                keepAspectRatio: args.keepAspectRatio !== false,
              },
              ...geometry,
              ...layoutItem,
            },
          },
        ] as any);
        return {
          content: [
            {
              type: 'text',
              text: `Created image ${args.name || 'Image'} (ID: ${shapeId}) from media ${args.mediaId}`,
            },
          ],
        };
      },
    },

    create_bool: {
      description:
        'Create a boolean group (union, difference, intersection, exclude) from existing shapes.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          shapeIds: { type: 'array', items: { type: 'string' } },
          boolType: {
            type: 'string',
            description: '"union" | "difference" | "intersection" | "exclude"',
          },
          name: { type: 'string', default: 'Bool' },
          parentId: { type: 'string' },
        },
        required: ['fileId', 'pageId', 'shapeIds', 'boolType'],
      },
      handler: async (args: any) => {
        if (!args.shapeIds?.length) {throw new Error('shapeIds required');}
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const objects = pagesIndex[args.pageId]?.objects || {};
        const first = objects[args.shapeIds[0]];
        if (!first) {throw new Error(`Shape not found: ${args.shapeIds[0]}`);}

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const id of args.shapeIds) {
          const s = objects[id];
          if (!s) {throw new Error(`Shape not found: ${id}`);}
          const x = s.x ?? s.selrect?.x ?? 0;
          const y = s.y ?? s.selrect?.y ?? 0;
          const w = s.width ?? s.selrect?.width ?? 0;
          const h = s.height ?? s.selrect?.height ?? 0;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
        }
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const boolId = uuidv4();
        const parentId = args.parentId || first.parentId || args.pageId;
        const frameId = first.frameId || parentId;
        const geometry = sharedGeometry(minX, minY, width, height);

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-obj',
            id: boolId,
            pageId: args.pageId,
            frameId,
            parentId,
            obj: {
              id: boolId,
              type: 'bool',
              name: args.name || 'Bool',
              boolType: args.boolType,
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
            parentId: boolId,
            shapes: args.shapeIds,
            index: null,
            ignoreTouched: true,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created bool ${args.boolType} (ID: ${boolId}) from ${args.shapeIds.length} shapes`,
            },
          ],
        };
      },
    },
  };
}
