/**
 * Webhook Tools - Event notification management
 */

import {
  PenpotClient,
  postCommandGetWebhooks,
  postCommandCreateWebhook,
  postCommandUpdateWebhook,
  postCommandDeleteWebhook,
} from '../penpot-client.js';

export function createWebhookTools(penpotClient: PenpotClient) {
  return {
    list_webhooks: {
      description: 'List all webhooks for a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID to get webhooks for',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetWebhooks({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to list webhooks: ${JSON.stringify(result.error)}`);
        }

        const webhooks = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${webhooks.length} webhook(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    create_webhook: {
      description: 'Create a new webhook for team event notifications',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID to create webhook for',
          },
          uri: {
            type: 'string',
            description: 'Webhook URL to receive POST requests',
          },
          mtype: {
            type: 'string',
            enum: ['application/json', 'application/transit+json'],
            description: 'Content type for webhook payloads',
          },
        },
        required: ['teamId', 'uri', 'mtype'],
      },
      handler: async (args: {
        teamId: string;
        uri: string;
        mtype: 'application/json' | 'application/transit+json';
      }) => {
        const result = await postCommandCreateWebhook({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            uri: args.uri,
            mtype: args.mtype,
          },
        });

        if (result.error) {
          throw new Error(`Failed to create webhook: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created webhook for ${args.uri}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_webhook: {
      description: 'Update an existing webhook (URL, type, or active status)',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'Webhook ID to update',
          },
          uri: {
            type: 'string',
            description: 'New webhook URL',
          },
          mtype: {
            type: 'string',
            enum: ['application/json', 'application/transit+json'],
            description: 'Content type for webhook payloads',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the webhook is active',
          },
        },
        required: ['webhookId', 'uri', 'mtype', 'isActive'],
      },
      handler: async (args: {
        webhookId: string;
        uri: string;
        mtype: 'application/json' | 'application/transit+json';
        isActive: boolean;
      }) => {
        const result = await postCommandUpdateWebhook({
          client: penpotClient.client,
          body: {
            id: args.webhookId,
            uri: args.uri,
            mtype: args.mtype,
            isActive: args.isActive,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update webhook: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated webhook: ${args.isActive ? 'active' : 'inactive'}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_webhook: {
      description: 'Delete a webhook',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'Webhook ID to delete',
          },
        },
        required: ['webhookId'],
      },
      handler: async (args: { webhookId: string }) => {
        const result = await postCommandDeleteWebhook({
          client: penpotClient.client,
          body: { id: args.webhookId },
        });

        if (result.error) {
          throw new Error(`Failed to delete webhook: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Webhook deleted successfully',
            },
          ],
        };
      },
    },
  };
}
