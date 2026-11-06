/**
 * Page Tools - Page operations
 */

import { PenpotClient } from '../penpot-client.js';
import { v4 as uuidv4 } from 'uuid';

export function createPageTools(penpotClient: PenpotClient) {
  return {
    list_pages: {
      description: 'List all pages in a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        // API returns camelCase: pagesIndex instead of pages-index
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};

        const pageList = Object.entries(pagesIndex).map(([id, page]: [string, any]) => ({
          id,
          name: page.name,
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Found ${pageList.length} pages`,
            },
            {
              type: 'text',
              text: JSON.stringify(pageList, null, 2),
            },
          ],
        };
      },
    },

    add_page: {
      description: 'Add a new page to a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          name: {
            type: 'string',
            description: 'Page name',
            default: 'New Page',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string; name?: string }) => {
        const pageId = uuidv4();
        const pageName = args.name || 'New Page';

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-page',
            id: pageId,
            name: pageName,
          },
        ] as any);

        return {
          content: [
            {
              type: 'text',
              text: `Added page: ${pageName} (ID: ${pageId})`,
            },
          ],
        };
      },
    },

    rename_page: {
      description: 'Rename a page (and optionally set its background color).',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          name: { type: 'string', description: 'New page name' },
          background: {
            type: 'string',
            description: 'Optional page background HEX color',
          },
        },
        required: ['fileId', 'pageId', 'name'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        name: string;
        background?: string;
      }) => {
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'mod-page',
            id: args.pageId,
            name: args.name,
            ...(args.background !== undefined && { background: args.background }),
          },
        ] as any);
        return {
          content: [{ type: 'text', text: `Renamed page ${args.pageId} to ${args.name}` }],
        };
      },
    },

    delete_page: {
      description: 'Delete a page from a file. Stale page ids fail boards; remove unused pages.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID to delete' },
        },
        required: ['fileId', 'pageId'],
      },
      handler: async (args: { fileId: string; pageId: string }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'del-page', id: args.pageId },
        ] as any);
        return {
          content: [{ type: 'text', text: `Deleted page ${args.pageId}` }],
        };
      },
    },

    move_page: {
      description: 'Reorder a page in the file page list.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string' },
          index: { type: 'number', description: 'New zero-based index' },
        },
        required: ['fileId', 'pageId', 'index'],
      },
      handler: async (args: { fileId: string; pageId: string; index: number }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'mov-page', id: args.pageId, index: args.index },
        ] as any);
        return {
          content: [{ type: 'text', text: `Moved page ${args.pageId} to index ${args.index}` }],
        };
      },
    },
  };
}
