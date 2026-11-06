/**
 * Component Tools - create, list, update, delete, instantiate, variants
 */

import { PenpotClient } from '../penpot-client.js';
import { v4 as uuidv4 } from 'uuid';
import { buildAddObjChanges, cloneShapeTree } from '../shape-builders.js';
import { resolveParentContext } from '../layout-helpers.js';

function componentsOf(file: any): Record<string, any> {
  const data = file.data as any;
  return data?.components || {};
}

function pageObjects(file: any, pageId: string): Record<string, any> {
  const data = file.data as any;
  const pagesIndex = data?.pagesIndex || data?.['pages-index'] || {};
  const page = pagesIndex[pageId];
  if (!page?.objects) {throw new Error(`Page not found: ${pageId}`);}
  return page.objects;
}

export function createComponentTools(penpotClient: PenpotClient) {
  return {
    create_component: {
      description: 'Create a component from a shape (main instance stays on the page).',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          pageId: { type: 'string', description: 'Page ID' },
          shapeId: { type: 'string', description: 'Shape ID to convert to component' },
          name: { type: 'string', description: 'Component name' },
          path: { type: 'string', description: 'Component library path' },
          variantId: { type: 'string', description: 'Optional variant container id' },
          variantProperties: {
            type: 'string',
            description: 'JSON array of {name, value} variant properties',
          },
        },
        required: ['fileId', 'pageId', 'shapeId'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        shapeId: string;
        name?: string;
        path?: string;
        variantId?: string;
        variantProperties?: string;
      }) => {
        const file = await penpotClient.getFile(args.fileId);
        const objects = pageObjects(file, args.pageId);
        const shape = objects[args.shapeId];
        if (!shape) {
          throw new Error(`Shape not found: ${args.shapeId}`);
        }

        const componentId = uuidv4();
        const componentName = args.name || shape.name || 'Component';
        const variantProperties = args.variantProperties
          ? JSON.parse(args.variantProperties)
          : undefined;

        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'add-component',
            id: componentId,
            name: componentName,
            path: args.path || componentName,
            mainInstanceId: args.shapeId,
            mainInstancePage: args.pageId,
            ...(args.variantId && { variantId: args.variantId }),
            ...(variantProperties && { variantProperties }),
          },
          {
            type: 'mod-obj',
            id: args.shapeId,
            pageId: args.pageId,
            operations: [
              { type: 'set', attr: 'componentId', val: componentId },
              { type: 'set', attr: 'mainInstance', val: true },
            ],
          },
        ] as any);

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
        const components = componentsOf(file);
        const componentList = Object.entries(components).map(([id, comp]: [string, any]) => ({
          id,
          name: comp.name,
          path: comp.path,
          mainInstanceId: comp.mainInstanceId || comp['main-instance-id'],
          mainInstancePage: comp.mainInstancePage || comp['main-instance-page'],
          variantId: comp.variantId || comp['variant-id'],
          variantProperties: comp.variantProperties || comp['variant-properties'],
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

    update_component: {
      description: 'Update component name, path, or variant properties.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          componentId: { type: 'string' },
          name: { type: 'string' },
          path: { type: 'string' },
          variantId: { type: 'string' },
          variantProperties: {
            type: 'string',
            description: 'JSON array of {name, value}',
          },
        },
        required: ['fileId', 'componentId'],
      },
      handler: async (args: any) => {
        const file = await penpotClient.getFile(args.fileId);
        if (!componentsOf(file)[args.componentId]) {
          throw new Error(`Component not found: ${args.componentId}`);
        }
        const variantProperties = args.variantProperties
          ? JSON.parse(args.variantProperties)
          : undefined;
        await penpotClient.applyChanges(args.fileId, [
          {
            type: 'mod-component',
            id: args.componentId,
            ...(args.name !== undefined && { name: args.name }),
            ...(args.path !== undefined && { path: args.path }),
            ...(args.variantId !== undefined && { variantId: args.variantId }),
            ...(variantProperties && { variantProperties }),
          },
        ] as any);
        return {
          content: [{ type: 'text', text: `Updated component ${args.componentId}` }],
        };
      },
    },

    delete_component: {
      description: 'Delete a component definition from the file library.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          componentId: { type: 'string' },
        },
        required: ['fileId', 'componentId'],
      },
      handler: async (args: { fileId: string; componentId: string }) => {
        await penpotClient.applyChanges(args.fileId, [
          { type: 'del-component', id: args.componentId },
        ] as any);
        return {
          content: [{ type: 'text', text: `Deleted component ${args.componentId}` }],
        };
      },
    },

    instantiate_component: {
      description:
        'Place a component instance on a page by cloning the main instance tree. Prefer this over rebuilding buttons from scratch.',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string' },
          pageId: { type: 'string', description: 'Page where the instance is placed' },
          componentId: { type: 'string' },
          parentId: { type: 'string' },
          x: { type: 'number', description: 'Absolute X for the instance root' },
          y: { type: 'number', description: 'Absolute Y for the instance root' },
          name: { type: 'string' },
        },
        required: ['fileId', 'pageId', 'componentId'],
      },
      handler: async (args: {
        fileId: string;
        pageId: string;
        componentId: string;
        parentId?: string;
        x?: number;
        y?: number;
        name?: string;
      }) => {
        const file = await penpotClient.getFile(args.fileId);
        const component = componentsOf(file)[args.componentId];
        if (!component) {
          throw new Error(`Component not found: ${args.componentId}`);
        }
        const mainPageId =
          component.mainInstancePage || component['main-instance-page'] || args.pageId;
        const mainId = component.mainInstanceId || component['main-instance-id'];
        if (!mainId) {
          throw new Error(`Component ${args.componentId} has no mainInstanceId`);
        }
        const objects = pageObjects(file, mainPageId);
        const main = objects[mainId];
        if (!main) {
          throw new Error(`Main instance shape not found: ${mainId}`);
        }

        const { parentId, frameId } = await resolveParentContext(
          penpotClient,
          args.fileId,
          args.pageId,
          args.parentId
        );

        const dx = args.x !== undefined ? args.x - (main.x ?? main.selrect?.x ?? 0) : 40;
        const dy = args.y !== undefined ? args.y - (main.y ?? main.selrect?.y ?? 0) : 40;

        const { rootId, shapes, order } = cloneShapeTree(objects, mainId, {
          dx,
          dy,
          parentId,
          frameId,
          asComponentInstance: {
            componentId: args.componentId,
            componentFile: args.fileId,
          },
        });
        if (args.name) {
          shapes[rootId].name = args.name;
        }

        await penpotClient.applyChanges(
          args.fileId,
          buildAddObjChanges(args.pageId, shapes, order, parentId, frameId) as any
        );

        return {
          content: [
            {
              type: 'text',
              text: `Instantiated component ${component.name || args.componentId} as ${rootId}`,
            },
            {
              type: 'text',
              text: JSON.stringify({ instanceId: rootId, componentId: args.componentId }, null, 2),
            },
          ],
        };
      },
    },
  };
}
