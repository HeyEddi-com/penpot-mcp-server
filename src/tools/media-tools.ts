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

    upload_media: {
      description:
        'Upload image bytes into a file media library. Pass base64 (optionally a data URL). Returns the media id for create_image or fillImageId.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          name: { type: 'string', description: 'Media name', default: 'upload' },
          filename: {
            type: 'string',
            description: 'Filename with extension',
            default: 'image.png',
          },
          mtype: { type: 'string', description: 'MIME type', default: 'image/png' },
          dataBase64: {
            type: 'string',
            description: 'Raw base64 or data:image/...;base64,... string',
          },
          isLocal: { type: 'boolean', default: true },
          id: { type: 'string', description: 'Optional media UUID' },
        },
        required: ['fileId', 'dataBase64'],
      },
      handler: async (args: {
        fileId: string;
        name?: string;
        filename?: string;
        mtype?: string;
        dataBase64: string;
        isLocal?: boolean;
        id?: string;
      }) => {
        let b64 = args.dataBase64;
        let mtype = args.mtype || 'image/png';
        const dataUrl = /^data:([^;]+);base64,(.+)$/s.exec(b64);
        if (dataUrl) {
          mtype = dataUrl[1] || mtype;
          b64 = dataUrl[2];
        }
        const bytes = Buffer.from(b64, 'base64');
        if (!bytes.length) {
          throw new Error('dataBase64 decoded to empty bytes');
        }
        const media = await penpotClient.uploadFileMediaObject({
          fileId: args.fileId,
          name: args.name || 'upload',
          filename: args.filename || 'image.png',
          mtype,
          bytes,
          isLocal: args.isLocal !== false,
          ...(args.id && { id: args.id }),
        });
        return {
          content: [
            {
              type: 'text',
              text: `Uploaded media ${args.name || 'upload'} (${bytes.length} bytes)`,
            },
            { type: 'text', text: JSON.stringify(media, null, 2) },
          ],
        };
      },
    },
  };
}
