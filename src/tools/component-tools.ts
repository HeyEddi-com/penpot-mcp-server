/**
 * Component Tools - Component operations
 */

import { PenpotClient } from '../penpot-client.js';
import { v4 as uuidv4 } from 'uuid';

export function createComponentTools(penpotClient: PenpotClient) {
  return {
    create_component: {
      description: 'Create a component from a shape',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape ID to convert to component' },
          name: { type: 'string', description: 'Component name' },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: { fileId: string; pageId: string; shapeId: string; name?: string }) => {
        // Get file to get current revision
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;
        const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
        const page = pagesIndex[args.pageId];

        if (!page) {
          throw new Error(`Page not found: ${args.pageId}`);
        }

        // Check if shape exists
        const objects = page.objects || {};
        const shape = objects[args.shapeId];
        if (!shape) {
          throw new Error(`Shape not found: ${args.shapeId}`);
        }

        // Generate component ID
        const componentId = uuidv4();
        const componentName = args.name || shape.name || 'Component';

        // Create add-component change
        const changes = [
          {
            type: 'add-component',
            id: componentId,
            name: componentName,
            path: componentName, // Use name as path by default
            mainInstanceId: args.shapeId,
            mainInstancePage: args.pageId,
          },
        ];

        // Apply changes
        await penpotClient.applyChanges(args.fileId, changes as any);

        return {
          content: [
            {
              type: 'text',
              text: `Created component: ${componentName} (ID: ${componentId})`,
            },
          ],
        };
      },
    },

    list_components: {
      description: 'List all components in a file',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
        },
        required: ['fileId'],
      },
      handler: async (args: { fileId: string }) => {
        const file = await penpotClient.getFile(args.fileId);
        const data = file.data as any;

        // Components are stored in the file data
        const components = data?.components || {};
        const componentList = Object.entries(components).map(([id, comp]: [string, any]) => ({
          id,
          name: comp.name,
          path: comp.path,
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Found ${componentList.length} components`,
            },
            {
              type: 'text',
              text: JSON.stringify(componentList, null, 2),
            },
          ],
        };
      },
    },
  };
}
