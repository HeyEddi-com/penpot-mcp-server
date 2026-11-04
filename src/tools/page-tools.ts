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
  };
}
