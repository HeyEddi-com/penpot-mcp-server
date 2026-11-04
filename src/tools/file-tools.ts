/**
 * File Tools - Core file operations using OpenAPI generated client
 */

import { PenpotClient } from '../penpot-client.js';

export function createFileTools(penpotClient: PenpotClient) {
  return {
    list_files: {
      description: 'List all files in a project',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'Project ID',
          },
        },
        required: ['projectId'],
      },
      handler: async (args: { projectId: string }) => {
        const files = await penpotClient.listFiles(args.projectId);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${files.length} files in project`,
            },
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      },
    },

    get_file: {
      description: 'Get detailed information about a file',
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
        return {
          content: [
            {
              type: 'text',
              text: `File: ${file.name}`,
            },
            {
              type: 'text',
              text: JSON.stringify(file, null, 2),
            },
          ],
        };
      },
    },

    create_file: {
      description: 'Create a new file in a project',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'Project ID',
          },
          name: {
            type: 'string',
            description: 'File name',
          },
          isShared: {
            type: 'boolean',
            description: 'Whether the file is shared',
            default: false,
          },
        },
        required: ['projectId', 'name'],
      },
      handler: async (args: { projectId: string; name: string; isShared?: boolean }) => {
        const file = await penpotClient.createFile({
          projectId: args.projectId,
          name: args.name,
          isShared: args.isShared ?? false,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Created file: ${file.name} (ID: ${file.id})`,
            },
            {
              type: 'text',
              text: JSON.stringify(file, null, 2),
            },
          ],
        };
      },
    },

    rename_file: {
      description: 'Rename a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          name: {
            type: 'string',
            description: 'New file name',
          },
        },
        required: ['fileId', 'name'],
      },
      handler: async (args: { fileId: string; name: string }) => {
        await penpotClient.renameFile(args.fileId, args.name);
        return {
          content: [
            {
              type: 'text',
              text: `File renamed to: ${args.name}`,
            },
          ],
        };
      },
    },

    delete_file: {
      description: 'Delete a file',
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
        await penpotClient.deleteFile(args.fileId);
        return {
          content: [
            {
              type: 'text',
              text: `File deleted successfully`,
            },
          ],
        };
      },
    },
  };
}
