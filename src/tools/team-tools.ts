/**
 * Team Tools - Team and project operations using OpenAPI generated client
 */

import {
  PenpotClient,
  postCommandCreateTeam,
  postCommandCreateProject,
  // postCommandGetProjectFiles, // Unused
  postCommandGetTeam,
  postCommandGetTeamStats,
  postCommandGetTeamMembers,
  postCommandUpdateTeam,
  postCommandDeleteTeam,
  postCommandUpdateTeamMemberRole,
  postCommandDeleteTeamMember,
  postCommandLeaveTeam,
  postCommandGetTeamInvitations,
  postCommandCreateTeamInvitations,
  postCommandDeleteTeamInvitation,
  postCommandUpdateTeamInvitationRole,
  postCommandGetTeamSharedFiles,
  postCommandGetTeamRecentFiles,
} from '../penpot-client.js';

export function createTeamTools(penpotClient: PenpotClient) {
  return {
    list_teams: {
      description: 'List all teams the user has access to',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => {
        const teams = await penpotClient.listTeams();
        return {
          content: [
            {
              type: 'text',
              text: `Found ${teams.length} teams`,
            },
            {
              type: 'text',
              text: JSON.stringify(teams, null, 2),
            },
          ],
        };
      },
    },

    list_projects: {
      description: 'List all projects in a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const projects = await penpotClient.listProjects(args.teamId);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${projects.length} projects`,
            },
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      },
    },

    create_team: {
      description: 'Create a new team',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Team name',
          },
          id: {
            type: 'string',
            description: 'Optional: Pre-specify team ID (UUID)',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Array of feature flags to enable',
          },
        },
        required: ['name'],
      },
      handler: async (args: { name: string; id?: string; features?: string[] }) => {
        const result = await postCommandCreateTeam({
          client: penpotClient.client,
          body: {
            name: args.name,
            ...(args.id && { id: args.id }),
            ...(args.features && { features: args.features }),
          },
        });

        if (result.error) {
          throw new Error(`Failed to create team: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created team: ${args.name}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    create_project: {
      description: 'Create a new project in a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          name: {
            type: 'string',
            description: 'Project name',
          },
          id: {
            type: 'string',
            description: 'Optional: Pre-specify project ID (UUID)',
          },
        },
        required: ['teamId', 'name'],
      },
      handler: async (args: { teamId: string; name: string; id?: string }) => {
        const result = await postCommandCreateProject({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            name: args.name,
            ...(args.id && { id: args.id }),
          },
        });

        if (result.error) {
          throw new Error(`Failed to create project: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created project: ${args.name}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    // ============================================================
    // Team Info & Stats
    // ============================================================

    get_team: {
      description:
        'Get detailed information about a specific team (provide either teamId or fileId)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID (optional if fileId provided)',
          },
          fileId: {
            type: 'string',
            description: 'File ID to get team from (optional if teamId provided)',
          },
        },
        required: [],
      },
      handler: async (args: { teamId?: string; fileId?: string }) => {
        if (!args.teamId && !args.fileId) {
          throw new Error('Either teamId or fileId must be provided');
        }

        const result = await postCommandGetTeam({
          client: penpotClient.client,
          body: {
            ...(args.teamId && { id: args.teamId }),
            ...(args.fileId && { fileId: args.fileId }),
          },
        });

        if (result.error) {
          throw new Error(`Failed to get team: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Team details:',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    get_team_stats: {
      description: 'Get statistics for a team (projects, files, members count)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetTeamStats({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to get team stats: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Team statistics:',
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_team: {
      description: 'Update team information (name)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          name: {
            type: 'string',
            description: 'New team name',
          },
        },
        required: ['teamId', 'name'],
      },
      handler: async (args: { teamId: string; name: string }) => {
        const result = await postCommandUpdateTeam({
          client: penpotClient.client,
          body: {
            id: args.teamId,
            name: args.name,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update team: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated team: ${args.name}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_team: {
      description: 'Delete a team (requires owner permissions)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandDeleteTeam({
          client: penpotClient.client,
          body: { id: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to delete team: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Team deleted successfully',
            },
          ],
        };
      },
    },

    // ============================================================
    // Team Members
    // ============================================================

    get_team_members: {
      description: 'Get list of all members in a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetTeamMembers({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to get team members: ${JSON.stringify(result.error)}`);
        }

        const members = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${members.length} team members`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    update_team_member_role: {
      description: "Update a team member's role (viewer, editor, admin, owner)",
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          memberId: {
            type: 'string',
            description: 'Member ID (user ID)',
          },
          role: {
            type: 'string',
            enum: ['viewer', 'editor', 'admin', 'owner'],
            description: 'New role for the member',
          },
        },
        required: ['teamId', 'memberId', 'role'],
      },
      handler: async (args: {
        teamId: string;
        memberId: string;
        role: 'viewer' | 'editor' | 'admin' | 'owner';
      }) => {
        const result = await postCommandUpdateTeamMemberRole({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            memberId: args.memberId,
            role: args.role,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update member role: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated member role to: ${args.role}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_team_member: {
      description: 'Remove a member from a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          memberId: {
            type: 'string',
            description: 'Member ID (user ID) to remove',
          },
        },
        required: ['teamId', 'memberId'],
      },
      handler: async (args: { teamId: string; memberId: string }) => {
        const result = await postCommandDeleteTeamMember({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            memberId: args.memberId,
          },
        });

        if (result.error) {
          throw new Error(`Failed to delete team member: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Team member removed successfully',
            },
          ],
        };
      },
    },

    leave_team: {
      description: 'Leave a team (current user leaves the team)',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID to leave',
          },
          reassignTo: {
            type: 'string',
            description: 'User ID to reassign ownership to (required if you are the last owner)',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string; reassignTo?: string }) => {
        const result = await postCommandLeaveTeam({
          client: penpotClient.client,
          body: {
            id: args.teamId,
            ...(args.reassignTo && { reassignTo: args.reassignTo }),
          },
        });

        if (result.error) {
          throw new Error(`Failed to leave team: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Successfully left the team',
            },
          ],
        };
      },
    },

    // ============================================================
    // Team Invitations
    // ============================================================

    get_team_invitations: {
      description: 'Get list of pending invitations for a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetTeamInvitations({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to get team invitations: ${JSON.stringify(result.error)}`);
        }

        const invitations = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${invitations.length} pending invitations`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    create_team_invitations: {
      description: 'Create invitations for one or more email addresses to join a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          emails: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of email addresses to invite',
          },
          role: {
            type: 'string',
            enum: ['viewer', 'editor', 'admin', 'owner'],
            description: 'Role for the invited members',
          },
        },
        required: ['teamId', 'emails', 'role'],
      },
      handler: async (args: {
        teamId: string;
        emails: string[];
        role: 'viewer' | 'editor' | 'admin' | 'owner';
      }) => {
        const result = await postCommandCreateTeamInvitations({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            emails: args.emails,
            role: args.role,
          },
        });

        if (result.error) {
          throw new Error(`Failed to create team invitations: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Created ${args.emails.length} invitation(s)`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    delete_team_invitation: {
      description: 'Delete a pending team invitation by email',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          email: {
            type: 'string',
            description: 'Email address of the invitation to delete',
          },
        },
        required: ['teamId', 'email'],
      },
      handler: async (args: { teamId: string; email: string }) => {
        const result = await postCommandDeleteTeamInvitation({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            email: args.email,
          },
        });

        if (result.error) {
          throw new Error(`Failed to delete team invitation: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Team invitation deleted successfully',
            },
          ],
        };
      },
    },

    update_team_invitation_role: {
      description: 'Update the role of a pending team invitation by email',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          email: {
            type: 'string',
            description: 'Email address of the invitation',
          },
          role: {
            type: 'string',
            enum: ['viewer', 'editor', 'admin', 'owner'],
            description: 'New role for the invitation',
          },
        },
        required: ['teamId', 'email', 'role'],
      },
      handler: async (args: {
        teamId: string;
        email: string;
        role: 'viewer' | 'editor' | 'admin' | 'owner';
      }) => {
        const result = await postCommandUpdateTeamInvitationRole({
          client: penpotClient.client,
          body: {
            teamId: args.teamId,
            email: args.email,
            role: args.role,
          },
        });

        if (result.error) {
          throw new Error(`Failed to update invitation role: ${JSON.stringify(result.error)}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Updated invitation role to: ${args.role}`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    // ============================================================
    // Team Files
    // ============================================================

    get_team_shared_files: {
      description: 'Get all files shared with a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetTeamSharedFiles({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to get team shared files: ${JSON.stringify(result.error)}`);
        }

        const files = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${files.length} shared files`,
            },
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      },
    },

    get_team_recent_files: {
      description: 'Get recently modified files in a team',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
        },
        required: ['teamId'],
      },
      handler: async (args: { teamId: string }) => {
        const result = await postCommandGetTeamRecentFiles({
          client: penpotClient.client,
          body: { teamId: args.teamId },
        });

        if (result.error) {
          throw new Error(`Failed to get team recent files: ${JSON.stringify(result.error)}`);
        }

        const files = Array.isArray(result.data) ? result.data : [];
        return {
          content: [
            {
              type: 'text',
              text: `Found ${files.length} recent files`,
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
