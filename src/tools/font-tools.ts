/**
 * Font Tools - Custom font management
 */

import {
  PenpotClient,
  postCommandGetFontVariants,
  postCommandCreateFontVariant,
  postCommandUpdateFont,
  postCommandDeleteFont,
  postCommandDeleteFontVariant,
} from '../penpot-client.js';

export function createFontTools(penpotClient: PenpotClient) {
  return {
    list_font_variants: {
      description: 'List all custom font variants for a team, file, or project',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID to get fonts for (optional)',
          },
          fileId: {
            type: 'string',
            description: 'File ID to get fonts for (optional)',
          },
          projectId: {
            type: 'string',
            description: 'Project ID to get fonts for (optional)',
          },
          shareId: {
            type: 'string',
            description: 'Share ID to get fonts for (optional)',
          },
        },
        required: [],
      },
      handler: async (args: {
        teamId?: string;
        fileId?: string;
        projectId?: string;
        shareId?: string;
      }) => {
        const result = await postCommandGetFontVariants({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            fileId: args.fileId,
            projectId: args.projectId,
            shareId: args.shareId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to list font variants: ${JSON.stringify(result.error)}`);
        }

        const fonts = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${fonts.length} font variant(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    create_font_variant: {
      description:
        'Create a new font variant (requires font data). Font weights: 100-900 in increments of 100.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          fontId: {
            type: 'string',
            description: 'Font ID (UUID for the font family)',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family name (e.g., "Roboto", "Arial")',
          },
          fontWeight: {
            type: 'string',
            enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
            description: 'Font weight (100=Thin, 400=Regular, 700=Bold, 900=Black)',
          },
          fontStyle: {
            type: 'string',
            enum: ['normal', 'italic'],
            description: 'Font style',
          },
          data: {
            type: 'object',
            description: 'Font data object (font file information)',
            additionalProperties: true,
          },
        },
        required: ['teamId', 'fontId', 'fontFamily', 'fontWeight', 'fontStyle', 'data'],
      },
      handler: async (args: {
        teamId: string;
        fontId: string;
        fontFamily: string;
        fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
        fontStyle: 'normal' | 'italic';
        data: Record<string, any>;
      }) => {
        const result = await postCommandCreateFontVariant({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            fontId: args.fontId,
            fontFamily: args.fontFamily,
            fontWeight: args.fontWeight,
            fontStyle: args.fontStyle,
            data: args.data,
          },
        });

        if (result.error) {
          throw new Error(`Failed to create font variant: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created font variant: ${args.fontFamily} ${args.fontWeight}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_font: {
      description: "Update a font's name",
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          fontId: {
            type: 'string',
            description: 'Font ID to update',
          },
          name: {
            type: 'string',
            description: 'New font name',
          },
        },
        required: ['teamId', 'fontId', 'name'],
      },
      handler: async (args: { teamId: string; fontId: string; name: string }) => {
        const result = await postCommandUpdateFont({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            id: args.fontId,
            name: args.name,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update font: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated font name to: ${args.name}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_font: {
      description: 'Delete a custom font (removes all variants)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          fontId: {
            type: 'string',
            description: 'Font ID to delete',
          },
        },
        required: ['teamId', 'fontId'],
      },
      handler: async (args: { teamId: string; fontId: string }) => {
        const result = await postCommandDeleteFont({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            id: args.fontId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to delete font: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Font deleted successfully',
            },
          ],
        };
      },
    },

    delete_font_variant: {
      description: 'Delete a specific font variant (e.g., Bold, Italic)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          variantId: {
            type: 'string',
            description: 'Font variant ID to delete',
          },
        },
        required: ['teamId', 'variantId'],
      },
      handler: async (args: { teamId: string; variantId: string }) => {
        const result = await postCommandDeleteFontVariant({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            id: args.variantId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to delete font variant: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Font variant deleted successfully',
            },
          ],
        };
      },
    },
  };
}
