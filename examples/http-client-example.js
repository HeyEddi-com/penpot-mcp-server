#!/usr/bin/env node

/**
 * Example HTTP/SSE MCP Client
 *
 * This example demonstrates how to connect to the Penpot MCP Server
 * running in HTTP/SSE mode and list available tools.
 *
 * Usage:
 *   node examples/http-client-example.js
 */

import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

let sessionId = null;
let requestId = 0;

/**
 * Connect to the MCP server via SSE
 */
async function connectToServer() {
  return new Promise((resolve, reject) => {
    console.log('Connecting to MCP server...');

    const eventSource = new EventSource(MCP_SERVER_URL);

    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', JSON.stringify(message, null, 2));

        // Handle endpoint event (contains session ID)
        if (message.endpoint) {
          sessionId = message.sessionId;
          console.log(`Session ID: ${sessionId}`);
          resolve({ eventSource, sessionId });
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      reject(error);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!sessionId) {
        eventSource.close();
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

/**
 * Send a JSON-RPC request to the MCP server
 */
async function sendRequest(method, params = {}) {
  if (!sessionId) {
    throw new Error('Not connected to server');
  }

  const request = {
    jsonrpc: '2.0',
    id: ++requestId,
    method,
    params,
  };

  console.log(`\nSending request: ${method}`);

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response;
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to server
    const { eventSource } = await connectToServer();

    // Wait a bit for initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initialize the MCP session
    console.log('\n--- Initializing MCP session ---');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'example-http-client',
        version: '1.0.0',
      },
    });

    // Wait for initialization response
    await new Promise((resolve) => setTimeout(resolve, 500));

    // List available tools
    console.log('\n--- Listing available tools ---');
    await sendRequest('tools/list');

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clean up
    console.log('\n--- Closing connection ---');
    eventSource.close();

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
