/**
 * Basic MCP Client Usage
 *
 * This example demonstrates connecting to an MCP server,
 * discovering tools, and invoking them.
 */

import { MCPClient } from '../src/index.js';

async function main() {
  // Create client for a stdio-based MCP server
  const client = new MCPClient({
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-example'],
    debug: true,
  });

  try {
    // Connect to the server
    console.log('Connecting to MCP server...');
    const capabilities = await client.connect();
    console.log('Server capabilities:', capabilities);

    // List available tools
    console.log('\n--- Available Tools ---');
    const tools = await client.listTools();
    for (const tool of tools) {
      console.log(`\n${tool.name}: ${tool.description}`);
      console.log('  Input schema:', JSON.stringify(tool.inputSchema, null, 2));
    }

    // Call a tool (example with a hypothetical echo tool)
    if (tools.some((t) => t.name === 'echo')) {
      console.log('\n--- Calling echo tool ---');
      const result = await client.callTool('echo', { message: 'Hello, MCP!' });
      console.log('Result:', result);
    }

    // List resources if available
    if (capabilities.resources) {
      console.log('\n--- Available Resources ---');
      const resources = await client.listResources();
      for (const resource of resources) {
        console.log(`${resource.name}: ${resource.uri}`);
      }
    }

    // List prompts if available
    if (capabilities.prompts) {
      console.log('\n--- Available Prompts ---');
      const prompts = await client.listPrompts();
      for (const prompt of prompts) {
        console.log(`${prompt.name}: ${prompt.description}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always disconnect
    await client.disconnect();
    console.log('\nDisconnected');
  }
}

main();
