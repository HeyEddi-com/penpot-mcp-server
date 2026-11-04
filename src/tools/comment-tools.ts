/**
 * Comment Tools - Comment and thread operations
 *
 * Note: GeomPoint type in OpenAPI is defined as 'string', but current implementation
 * uses { x: number, y: number } object format. This appears to work with the API.
 * If issues occur, consider investigating the actual GeomPoint format expected by API.
 */

import { PenpotClient } from '../penpot-client.js';

export function createCommentTools(penpotClient: PenpotClient) {
  return {
    create_comment_thread: {
      description: 'Create a new comment thread on a page',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          frameId: { type: 'string', description: 'Frame ID where comment is placed' },
          content: { type: 'string', description: 'Comment content (max 750 chars)' },
          x: { type: 'number', description: 'X position', default: 0 },
          y: { type: 'number', description: 'Y position', default: 0 },
          shareId: { type: 'string', description: 'Share ID (optional)' },
          mentions: {
            type: 'array',
            items: { type: 'string' },
            description: 'User IDs to mention',
          },
        },
        required: ['fileId', 'pageId', 'frameId', 'content'],
      },
      handler: async (args: any) => {
        const thread = await penpotClient.createCommentThread({
          fileId: args.fileId,
          pageId: args.pageId,
          frameId: args.frameId,
          position: { x: args.x || 0, y: args.y || 0 },
          content: args.content,
          shareId: args.shareId,
          mentions: args.mentions,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Created comment thread`,
            },
            {
              type: 'text',
              text: JSON.stringify(thread, null, 2),
            },
          ],
        };
      },
    },

    list_comment_threads: {
      description: 'List all comment threads in a file or team (provide either fileId or teamId)',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID (optional if teamId provided)' },
          teamId: {
            type: 'string',
            description: 'Team ID to list all team threads (optional if fileId provided)',
          },
          shareId: { type: 'string', description: 'Share ID (optional)' },
        },
        required: [],
      },
      handler: async (args: { fileId?: string; teamId?: string; shareId?: string }) => {
        if (!args.fileId && !args.teamId) {
          throw new Error('Either fileId or teamId must be provided');
        }

        const threads = await penpotClient.getCommentThreads({
          fileId: args.fileId,
          teamId: args.teamId,
          shareId: args.shareId,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Found ${threads.length} comment thread(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(threads, null, 2),
            },
          ],
        };
      },
    },

    get_comment_thread: {
      description: 'Get details of a specific comment thread',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          threadId: { type: 'string', description: 'Thread ID' },
        },
        required: ['fileId', 'threadId'],
      },
      handler: async (args: { fileId: string; threadId: string }) => {
        const thread = await penpotClient.getCommentThread(args.fileId, args.threadId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(thread, null, 2),
            },
          ],
        };
      },
    },

    get_comments: {
      description: 'Get all comments in a thread',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string', description: 'Thread ID' },
        },
        required: ['threadId'],
      },
      handler: async (args: { threadId: string }) => {
        const comments = await penpotClient.getComments(args.threadId);

        return {
          content: [
            {
              type: 'text',
              text: `Found ${comments.length} comment(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(comments, null, 2),
            },
          ],
        };
      },
    },

    create_comment: {
      description: 'Add a comment to an existing thread',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string', description: 'Thread ID' },
          content: { type: 'string', description: 'Comment content' },
          shareId: { type: 'string', description: 'Share ID (optional)' },
          mentions: {
            type: 'array',
            items: { type: 'string' },
            description: 'User IDs to mention (optional)',
          },
        },
        required: ['threadId', 'content'],
      },
      handler: async (args: {
        threadId: string;
        content: string;
        shareId?: string;
        mentions?: string[];
      }) => {
        const comment = await penpotClient.createComment(
          args.threadId,
          args.content,
          args.shareId,
          args.mentions
        );

        return {
          content: [
            {
              type: 'text',
              text: `Created comment`,
            },
            {
              type: 'text',
              text: JSON.stringify(comment, null, 2),
            },
          ],
        };
      },
    },

    update_comment: {
      description: 'Update a comment content',
      inputSchema: {
        type: 'object',
        properties: {
          commentId: { type: 'string', description: 'Comment ID' },
          content: { type: 'string', description: 'New comment content' },
          shareId: { type: 'string', description: 'Share ID (optional)' },
          mentions: {
            type: 'array',
            items: { type: 'string' },
            description: 'User IDs to mention (optional)',
          },
        },
        required: ['commentId', 'content'],
      },
      handler: async (args: {
        commentId: string;
        content: string;
        shareId?: string;
        mentions?: string[];
      }) => {
        const comment = await penpotClient.updateComment(
          args.commentId,
          args.content,
          args.shareId,
          args.mentions
        );

        return {
          content: [
            {
              type: 'text',
              text: `Updated comment`,
            },
            {
              type: 'text',
              text: JSON.stringify(comment, null, 2),
            },
          ],
        };
      },
    },

    delete_comment: {
      description: 'Delete a comment',
      inputSchema: {
        type: 'object',
        properties: {
          commentId: { type: 'string', description: 'Comment ID' },
          shareId: { type: 'string', description: 'Share ID (optional)' },
        },
        required: ['commentId'],
      },
      handler: async (args: { commentId: string; shareId?: string }) => {
        await penpotClient.deleteComment(args.commentId, args.shareId);

        return {
          content: [
            {
              type: 'text',
              text: `Deleted comment: ${args.commentId}`,
            },
          ],
        };
      },
    },

    update_comment_thread_status: {
      description: 'Mark a comment thread as resolved or unresolved',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string', description: 'Thread ID' },
          isResolved: { type: 'boolean', description: 'Whether thread is resolved' },
        },
        required: ['threadId', 'isResolved'],
      },
      handler: async (args: { threadId: string; isResolved: boolean }) => {
        const thread = await penpotClient.updateCommentThreadStatus(args.threadId, args.isResolved);

        return {
          content: [
            {
              type: 'text',
              text: `Updated thread status to ${args.isResolved ? 'resolved' : 'unresolved'}`,
            },
            {
              type: 'text',
              text: JSON.stringify(thread, null, 2),
            },
          ],
        };
      },
    },

    update_comment_thread_position: {
      description: 'Move a comment thread to a new position',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string', description: 'Thread ID' },
          frameId: { type: 'string', description: 'Frame ID (required)' },
          x: { type: 'number', description: 'New X position' },
          y: { type: 'number', description: 'New Y position' },
          shareId: { type: 'string', description: 'Share ID (optional)' },
        },
        required: ['threadId', 'frameId', 'x', 'y'],
      },
      handler: async (args: {
        threadId: string;
        frameId: string;
        x: number;
        y: number;
        shareId?: string;
      }) => {
        const thread = await penpotClient.updateCommentThreadPosition(
          args.threadId,
          args.frameId,
          { x: args.x, y: args.y },
          args.shareId
        );

        return {
          content: [
            {
              type: 'text',
              text: `Moved thread to position (${args.x}, ${args.y}) in frame ${args.frameId}`,
            },
            {
              type: 'text',
              text: JSON.stringify(thread, null, 2),
            },
          ],
        };
      },
    },

    delete_comment_thread: {
      description: 'Delete a comment thread',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string', description: 'Thread ID' },
        },
        required: ['threadId'],
      },
      handler: async (args: { threadId: string }) => {
        await penpotClient.deleteCommentThread(args.threadId);

        return {
          content: [
            {
              type: 'text',
              text: `Deleted comment thread: ${args.threadId}`,
            },
          ],
        };
      },
    },

    get_unread_comment_threads: {
      description: 'Get all unread comment threads for a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: { type: 'string', description: 'Team ID' },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const threads = await penpotClient.getUnreadCommentThreads(args.teamId);

        return {
          content: [
            {
              type: 'text',
              text: `Found ${threads.length} unread thread(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(threads, null, 2),
            },
          ],
        };
      },
    },
  };
}
