/**
 * Snapshot Tools - File version management with snapshots
 */

import {
  PenpotClient,
  postCommandGetFileSnapshots,
  postCommandCreateFileSnapshot,
  postCommandUpdateFileSnapshot,
  postCommandDeleteFileSnapshot,
  postCommandRestoreFileSnapshot,
  postCommandLockFileSnapshot,
  postCommandUnlockFileSnapshot,
} from '../penpot-client.js';

export function createSnapshotTools(penpotClient: PenpotClient) {
  return {
    list_file_snapshots: {
      description: 'List all snapshots (versions) of a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to get snapshots for',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const result = await postCommandGetFileSnapshots({
          client: penpotClient.client,
          body: { fileId: args.fileId },
        });

        if (result.error) {
          throw new Error(`Failed to list file snapshots: ${JSON.stringify(result.error)}`);
        }

        const snapshots = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${snapshots.length} snapshot(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    create_file_snapshot: {
      description: 'Create a new snapshot (version) of a file for backup/versioning',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to create snapshot for',
          },
          label: {
            type: 'string',
            description:
              'Optional label/description for this snapshot (e.g., "Before major redesign")',
          },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string; label?: string }) => {
        const result = await postCommandCreateFileSnapshot({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            label: args.label,
          },
        });

        if (result.error) {
          throw new Error(`Failed to create file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created file snapshot${args.label ? `: ${args.label}` : ''}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_file_snapshot: {
      description: "Update a snapshot's label/description",
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to update',
          },
          label: {
            type: 'string',
            description: 'New label/description for the snapshot',
          },
        },
        required: ['snapshotId', 'label'],
      },
      handler: async (args: { snapshotId: string; label: string }) => {
        const result = await postCommandUpdateFileSnapshot({
          client: penpotClient.client,
          body: {
            id: args.snapshotId,
            label: args.label,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated snapshot label to: ${args.label}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_file_snapshot: {
      description: 'Delete a file snapshot (version)',
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to delete',
          },
        },
        required: ['snapshotId'],
      },
      handler: async (args: { snapshotId: string }) => {
        const result = await postCommandDeleteFileSnapshot({
          client: penpotClient.client,
          body: { id: args.snapshotId },
        });

        if (result.error) {
          throw new Error(`Failed to delete file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File snapshot deleted successfully',
            },
          ],
        };
      },
    },

    restore_file_snapshot: {
      description:
        'Restore a file to a previous snapshot (version). This will replace the current file content with the snapshot content.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'string',
            description: 'File ID to restore',
          },
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to restore from',
          },
        },
        required: ['fileId', 'snapshotId'],
      },
      handler: async (args: { fileId: string; snapshotId: string }) => {
        const result = await postCommandRestoreFileSnapshot({
          client: penpotClient.client,
          body: {
            fileId: args.fileId,
            id: args.snapshotId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to restore file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File restored from snapshot successfully',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    lock_file_snapshot: {
      description: 'Lock a snapshot to prevent it from being deleted (protect important versions)',
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to lock',
          },
        },
        required: ['snapshotId'],
      },
      handler: async (args: { snapshotId: string }) => {
        const result = await postCommandLockFileSnapshot({
          client: penpotClient.client,
          body: { id: args.snapshotId },
        });

        if (result.error) {
          throw new Error(`Failed to lock file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File snapshot locked successfully',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    unlock_file_snapshot: {
      description: 'Unlock a snapshot to allow deletion',
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to unlock',
          },
        },
        required: ['snapshotId'],
      },
      handler: async (args: { snapshotId: string }) => {
        const result = await postCommandUnlockFileSnapshot({
          client: penpotClient.client,
          body: { id: args.snapshotId },
        });

        if (result.error) {
          throw new Error(`Failed to unlock file snapshot: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'File snapshot unlocked successfully',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },
  };
}
