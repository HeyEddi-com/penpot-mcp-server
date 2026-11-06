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

    duplicate_file: {
      description: 'Duplicate an entire Penpot file in the same project.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          name: { type: 'string', description: 'Optional name for the copy' },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string; name?: string }) => {
        const file = await penpotClient.duplicateFile(args.fileId, args.name);
        return {
          content: [
            { type: 'text', text: `Duplicated file ${args.fileId}` },
            { type: 'text', text: JSON.stringify(file, null, 2) },
          ],
        };
      },
    },

    export_binfile: {
      description:
        'Export a .penpot binary (base64 in the tool result). Use includeLibraries/embedAssets as needed.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          includeLibraries: { type: 'boolean', default: true },
          embedAssets: { type: 'boolean', default: false },
        },
        required: ['fileId'],
      },
      handler: async (args: {
        fileId: string;
        includeLibraries?: boolean;
        embedAssets?: boolean;
      }) => {
        const bytes = await penpotClient.exportBinfile({
          fileId: args.fileId,
          includeLibraries: args.includeLibraries,
          embedAssets: args.embedAssets,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Exported .penpot binary (${bytes.length} bytes) as base64`,
            },
            {
              type: 'text',
              text: bytes.toString('base64'),
            },
          ],
        };
      },
    },

    import_binfile: {
      description: 'Import a .penpot binary (base64) into a project.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          name: { type: 'string' },
          filename: { type: 'string', default: 'import.penpot' },
          dataBase64: { type: 'string', description: 'Base64 of the .penpot file' },
          fileId: { type: 'string', description: 'Optional target file id' },
        },
        required: ['projectId', 'name', 'dataBase64'],
      },
      handler: async (args: {
        projectId: string;
        name: string;
        filename?: string;
        dataBase64: string;
        fileId?: string;
      }) => {
        const bytes = Buffer.from(args.dataBase64, 'base64');
        if (!bytes.length) {throw new Error('dataBase64 decoded empty');}
        const result = await penpotClient.importBinfile({
          projectId: args.projectId,
          name: args.name,
          filename: args.filename || 'import.penpot',
          bytes,
          ...(args.fileId && { fileId: args.fileId }),
        });
        return {
          content: [
            { type: 'text', text: `Imported ${args.name} (${bytes.length} bytes)` },
            { type: 'text', text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  };
}
