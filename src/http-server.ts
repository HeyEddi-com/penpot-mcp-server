#!/usr/bin/env node

/**
 * Penpot MCP Server - HTTP/SSE Mode
 * Runs the MCP server over HTTP with Server-Sent Events for external access
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const HTTP_HOST = process.env.HTTP_HOST || '0.0.0.0';

if (!PENPOT_ACCESS_TOKEN) {
  console.error('Error: PENPOT_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Penpot client
const penpotClient = new PenpotClient({
  apiUrl: PENPOT_API_URL,
  accessToken: PENPOT_ACCESS_TOKEN,
});

// Store active session count for monitoring
let activeSessionCount = 0;

/**
 * Create a new MCP server instance with all tools
 */
function createMcpServer(): Server {
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

  return server;
}

// Create single server and transport instance
const mcpServer = createMcpServer();
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: async (sessionId: string) => {
    activeSessionCount++;
    console.log(`[HTTP] New session initialized: ${sessionId} (total: ${activeSessionCount})`);
  },
  onsessionclosed: async (sessionId: string) => {
    activeSessionCount--;
    console.log(`[HTTP] Session closed: ${sessionId} (total: ${activeSessionCount})`);
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean),
  allowedHosts: process.env.ALLOWED_HOSTS?.split(',').filter(Boolean),
  enableDnsRebindingProtection: process.env.ENABLE_DNS_REBINDING_PROTECTION === 'true',
});

/**
 * Parse JSON from request body
 */
async function parseRequestBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve(undefined);
        }
      } catch (_error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Main HTTP server handler
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', sessions: activeSessionCount }));
    return;
  }

  // Handle MCP requests on /mcp endpoint
  if (req.url?.startsWith('/mcp')) {
    try {
      // Parse body for POST requests
      let parsedBody: unknown;
      if (req.method === 'POST') {
        parsedBody = await parseRequestBody(req);
      }

      // Handle the request using the shared transport
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      console.error('[HTTP] Request error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal server error',
          })
        );
      }
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Start the HTTP server
 */
async function main() {
  // Connect MCP server to transport
  await mcpServer.connect(transport);
  console.log('[HTTP] MCP server connected to transport');

  const httpServer = createServer(handleRequest);

  httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`Penpot MCP Server running on http://${HTTP_HOST}:${HTTP_PORT}`);
    console.log(`MCP endpoint: http://${HTTP_HOST}:${HTTP_PORT}/mcp`);
    console.log(`Health check: http://${HTTP_HOST}:${HTTP_PORT}/health`);
    console.log('');
    console.log('Configuration:');
    console.log(`  - Penpot API URL: ${PENPOT_API_URL}`);
    console.log(`  - Transport: HTTP/SSE`);
    console.log(`  - Active sessions: 0`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down server...');
    httpServer.close(async () => {
      await transport.close();
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
