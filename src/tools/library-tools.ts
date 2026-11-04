/**
 * Library Tools - Component library management and linking
 */

import {
  PenpotClient,
  postCommandGetFileLibraries,
  postCommandLinkFileToLibrary,
  postCommandUnlinkFileFromLibrary,
  postCommandHasFileLibraries,
  postCommandGetLibraryUsage,
  postCommandGetLibraryFileReferences,
  postCommandUpdateFileLibrarySyncStatus,
  postCommandIgnoreFileLibrarySyncStatus,
} from '../penpot-client.js';

export function createLibraryTools(penpotClient: PenpotClient) {
  return {
    get_file_libraries: {
      description: 'Get all component libraries used by a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to get libraries for',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const result = await postCommandGetFileLibraries({
          client: penpotClient.client,
          body: { fileId: args.fileId },
        });

        if (result.error) {
          throw new Error(`Failed to get file libraries: ${JSON.stringify(result.error)}`);
        }

        const libraries = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${libraries.length} library/libraries`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    has_file_libraries: {
      description: 'Check if a file uses any component libraries (returns boolean)',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to check',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const result = await postCommandHasFileLibraries({
          client: penpotClient.client,
          body: { fileId: args.fileId },
        });

        if (result.error) {
          throw new Error(`Failed to check file libraries: ${JSON.stringify(result.error)}`);
        }

        const hasLibraries = result.data === true;
        return {
          content: [
            {
              type: 'text',
              text: `File ${hasLibraries ? 'uses' : 'does not use'} component libraries`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    link_file_to_library: {
      description:
        'Link a file to a component library to use its components. Returns recursive list of libraries used by that library.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to link',
          },
          libraryId: {
            type: 'string',
            description: 'Library (file) ID to link to',
          },
        },
        required: ['fileId', 'libraryId'],
      },
      handler: async (args: { fileId: string; libraryId: string }) => {
        const result = await postCommandLinkFileToLibrary({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            libraryId: args.libraryId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to link file to library: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File linked to library successfully',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    unlink_file_from_library: {
      description: 'Unlink a file from a component library',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to unlink',
          },
          libraryId: {
            type: 'string',
            description: 'Library (file) ID to unlink from',
          },
        },
        required: ['fileId', 'libraryId'],
      },
      handler: async (args: { fileId: string; libraryId: string }) => {
        const result = await postCommandUnlinkFileFromLibrary({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            libraryId: args.libraryId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to unlink file from library: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File unlinked from library successfully',
            },
          ],
        };
      },
    },

    get_library_usage: {
      description: 'Get the number of files that use this library',
      inputSchema: {
        type: 'object',
        properties: {
          libraryId: {
            type: 'string',
            description: 'Library (file) ID to check usage for',
          },
        },
        required: ['libraryId'],
      },
      handler: async (args: { libraryId: string }) => {
        const result = await postCommandGetLibraryUsage({
          client: penpotClient.client,
          body: { fileId: args.libraryId },
        });

        if (result.error) {
          throw new Error(`Failed to get library usage: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Library usage statistics:',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    get_library_file_references: {
      description: 'Get all file references that use this library',
      inputSchema: {
        type: 'object',
        properties: {
          libraryId: {
            type: 'string',
            description: 'Library (file) ID to get references for',
          },
        },
        required: ['libraryId'],
      },
      handler: async (args: { libraryId: string }) => {
        const result = await postCommandGetLibraryFileReferences({
          client: penpotClient.client,
          body: { fileId: args.libraryId },
        });

        if (result.error) {
          throw new Error(`Failed to get library file references: ${JSON.stringify(result.error)}`);
        }

        const references = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${references.length} file(s) using this library`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_file_library_sync_status: {
      description: 'Update the synchronization status of a file->library link',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          libraryId: {
            type: 'string',
            description: 'Library (file) ID',
          },
        },
        required: ['fileId', 'libraryId'],
      },
      handler: async (args: { fileId: string; libraryId: string }) => {
        const result = await postCommandUpdateFileLibrarySyncStatus({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            libraryId: args.libraryId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update library sync status: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Library sync status updated successfully',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    ignore_file_library_sync_status: {
      description: 'Ignore library synchronization status for a file at a specific date/time',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID',
          },
          date: {
            type: 'string',
            description: 'ISO date string to ignore sync from (e.g., "2024-01-01T00:00:00Z")',
          },
        },
        required: ['fileId', 'date'],
      },
      handler: async (args: { fileId: string; date: string }) => {
        const result = await postCommandIgnoreFileLibrarySyncStatus({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            date: args.date,
          },
        });

        if (result.error) {
          throw new Error(`Failed to ignore library sync status: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Library sync status ignored successfully',
            },
          ],
        };
      },
    },
  };
}
