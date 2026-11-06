#!/usr/bin/env node

/**
 * Penpot MCP Server
 * A Model Context Protocol server for Penpot with full manipulation capabilities
 *
 * Usage:
 *   - stdio mode (default): penpot-mcp-server
 *   - HTTP mode: TRANSPORT=http penpot-mcp-server
 *   - HTTP mode with custom port: TRANSPORT=http HTTP_PORT=8080 penpot-mcp-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { PenpotClient } from './penpot-client.js';
import { createFileTools } from './tools/file-tools.js';
import { createPageTools } from './tools/page-tools.js';
import { createPageAdvancedTools } from './tools/page-advanced-tools.js';
import { createShapeTools } from './tools/shape-tools.js';
import { createComponentTools } from './tools/component-tools.js';
import { createTeamTools } from './tools/team-tools.js';
import { createShareTools } from './tools/share-tools.js';
import { createCommentTools } from './tools/comment-tools.js';
import { createExportTools } from './tools/export-tools.js';
import { createMediaTools } from './tools/media-tools.js';
import { createFontTools } from './tools/font-tools.js';
import { createWebhookTools } from './tools/webhook-tools.js';
import { createSearchTools } from './tools/search-tools.js';
import { createProfileTools } from './tools/profile-tools.js';
import { createSnapshotTools } from './tools/snapshot-tools.js';
import { createLibraryTools } from './tools/library-tools.js';
import { createAlignmentTools } from './tools/alignment-tools.js';
import { createLayoutTools } from './tools/layout-tools.js';
import { createStructureTools } from './tools/structure-tools.js';
import { createAssetTools } from './tools/asset-tools.js';
import { createTokenTools } from './tools/token-tools.js';
import { createPrototypeTools } from './tools/prototype-tools.js';

// Get configuration from environment variables
const PENPOT_API_URL = process.env.PENPOT_API_URL || 'https://design.penpot.app';
const PENPOT_ACCESS_TOKEN = process.env.PENPOT_ACCESS_TOKEN;
const TRANSPORT_MODE = process.env.TRANSPORT || 'stdio';

if (!PENPOT_ACCESS_TOKEN) {
  console.error('Error: PENPOT_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Check if we should run in HTTP mode
if (TRANSPORT_MODE === 'http') {
  // Import and run HTTP server
  import('./http-server.js').catch((error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });
} else {
  // Run stdio mode (default)
  // Initialize Penpot client
  const penpotClient = new PenpotClient({
    apiUrl: PENPOT_API_URL,
    accessToken: PENPOT_ACCESS_TOKEN,
  });

  // Create MCP server
  const server = new Server(
    {
      name: 'penpot-mcp-server',
      version: '1.3.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Combine all tools
  const allTools = {
    ...createFileTools(penpotClient),
    ...createPageTools(penpotClient),
    ...createPageAdvancedTools(penpotClient),
    ...createShapeTools(penpotClient),
    ...createComponentTools(penpotClient),
    ...createTeamTools(penpotClient),
    ...createShareTools(penpotClient),
    ...createCommentTools(penpotClient),
    ...createExportTools(penpotClient),
    ...createMediaTools(penpotClient),
    ...createFontTools(penpotClient),
    ...createWebhookTools(penpotClient),
    ...createSearchTools(penpotClient),
    ...createProfileTools(penpotClient),
    ...createSnapshotTools(penpotClient),
    ...createLibraryTools(penpotClient),
    ...createAlignmentTools(penpotClient),
    ...createLayoutTools(penpotClient),
    ...createStructureTools(penpotClient),
    ...createAssetTools(penpotClient),
    ...createTokenTools(penpotClient),
    ...createPrototypeTools(penpotClient),
  };

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.entries(allTools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = allTools[toolName as keyof typeof allTools];

    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${toolName}`);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await tool.handler(request.params.arguments as any);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
      throw error;
    }
  });

  // Error handler
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  // Start the server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Penpot MCP Server running on stdio');
  }

  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
