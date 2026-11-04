/**
 * Profile Tools - User profile operations
 */

import { PenpotClient, postCommandGetProfile } from '../penpot-client.js';

export function createProfileTools(penpotClient: PenpotClient) {
  return {
    get_profile: {
      description: 'Get current user profile',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => {
        const result = await postCommandGetProfile({
          client: penpotClient.client,
          body: {},
        });

        if (result.error) {
          throw new Error(`Failed to get profile: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
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
