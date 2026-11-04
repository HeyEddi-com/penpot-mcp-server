/**
 * Search Tools - Search operations
 */

import { PenpotClient } from '../penpot-client.js';

export function createSearchTools(penpotClient: PenpotClient) {
  return {
    search_shapes: {
      description: 'Search for shapes in a file by name',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          query: { type: 'string', description: 'Search query' },
        },
        required: ['fileId', 'query'],
      },
      handler: async (args: { fileId: string; query: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};

        const results: any[] = [];
        for (const [pageId, page] of Object.entries(pagesIndex) as any) {
          const objects = page.objects || {};
          for (const [id, obj] of Object.entries(objects) as any) {
            if (obj.name?.toLowerCase().includes(args.query.toLowerCase())) {
              results.push({
                id,
                name: obj.name,
                type: obj.type,
                pageId,
                pageName: page.name,
              });
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} shapes matching "${args.query}"`,
            },
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      },
    },

    search_files: {
      description: 'Search for files by name',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID to search in' },
          query: { type: 'string', description: 'Search query' },
        },
        required: ['projectId', 'query'],
      },
      handler: async (args: { projectId: string; query: string }) => {
        const files = await penpotClient.listFiles(args.projectId);
        const results = files.filter((file: any) =>
          file.name.toLowerCase().includes(args.query.toLowerCase())
        );

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} files matching "${args.query}"`,
            },
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      },
    },
  };
}
