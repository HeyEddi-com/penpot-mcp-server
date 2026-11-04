/**
 * Media Tools - Media/image operations
 */

import { PenpotClient } from '../penpot-client.js';

export function createMediaTools(penpotClient: PenpotClient) {
  return {
    create_media_from_url: {
      description: 'Create a media object from a URL',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          url: { type: 'string', description: 'URL of the image to import' },
          isLocal: { type: 'boolean', description: 'Whether media is local to file' },
          id: { type: 'string', description: 'Optional: Pre-specify media object ID (UUID)' },
          name: { type: 'string', description: 'Optional: Custom name for media object' },
        },
        required: ['fileId', 'url', 'isLocal'],
      },
      handler: async (args: {
        fileId: string;
        url: string;
        isLocal: boolean;
        id?: string;
        name?: string;
      }) => {
        const media = await penpotClient.createFileMediaObjectFromUrl({
          fileId: args.fileId,
          url: args.url,
          isLocal: args.isLocal,
          ...(args.id && { id: args.id }),
          ...(args.name && { name: args.name }),
        });

        return {
          content: [
            {
              type: 'text',
              text: `Created media object from URL`,
            },
            {
              type: 'text',
              text: JSON.stringify(media, null, 2),
            },
          ],
        };
      },
    },

    clone_media_object: {
      description: 'Clone an existing media object',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'Target file ID' },
          id: { type: 'string', description: 'Media object ID to clone' },
          isLocal: { type: 'boolean', description: 'Whether media is local to file' },
        },
        required: ['fileId', 'id', 'isLocal'],
      },
      handler: async (args: { fileId: string; id: string; isLocal: boolean }) => {
        const media = await penpotClient.cloneFileMediaObject({
          fileId: args.fileId,
          id: args.id,
          isLocal: args.isLocal,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Cloned media object`,
            },
            {
              type: 'text',
              text: JSON.stringify(media, null, 2),
            },
          ],
        };
      },
    },

    list_file_media: {
      description: 'List all media objects in a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        // Get file data which contains media information
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;

        // Extract media objects from file data
        const media = data?.media || {};
        const mediaList = Object.entries(media).map(([id, mediaObj]: [string, any]) => ({
          id,
          name: mediaObj.name,
          width: mediaObj.width,
          height: mediaObj.height,
          mtype: mediaObj.mtype,
          thumbPath: mediaObj.thumbPath,
          path: mediaObj.path,
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Found ${mediaList.length} media object(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(mediaList, null, 2),
            },
          ],
        };
      },
    },
  };
}
