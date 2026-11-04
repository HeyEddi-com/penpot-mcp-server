/**
 * Share Tools - File sharing operations
 */

import { PenpotClient } from '../penpot-client.js';

export function createShareTools(penpotClient: PenpotClient) {
  return {
    create_share_link: {
      description: 'Create a shareable link for a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          whoComment: {
            type: 'string',
            enum: ['all', 'team', 'none'],
            description: 'Who can comment',
          },
          whoInspect: {
            type: 'string',
            enum: ['all', 'team', 'none'],
            description: 'Who can inspect',
          },
          pages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of page IDs to share (empty array for all pages)',
          },
        },
        required: ['fileId', 'whoComment', 'whoInspect', 'pages'],
      },
      handler: async (args: {
        fileId: string;
        whoComment: 'all' | 'team' | 'none';
        whoInspect: 'all' | 'team' | 'none';
        pages: string[];
      }) => {
        const link = await penpotClient.createShareLink({
          fileId: args.fileId,
          whoComment: args.whoComment,
          whoInspect: args.whoInspect,
          pages: args.pages,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Created share link`,
            },
            {
              type: 'text',
              text: JSON.stringify(link, null, 2),
            },
          ],
        };
      },
    },

    delete_share_link: {
      description: 'Delete a share link',
      inputSchema: {
        type: 'object',
        properties: {
          linkId: { type: 'string', description: 'Share link ID' },
        },
        required: ['linkId'],
      },
      handler: async (args: { linkId: string }) => {
        await penpotClient.deleteShareLink(args.linkId);

        return {
          content: [
            {
              type: 'text',
              text: `Deleted share link: ${args.linkId}`,
            },
          ],
        };
      },
    },
  };
}
