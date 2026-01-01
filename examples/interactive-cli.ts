/**
 * Interactive MCP CLI
 *
 * A simple REPL for interacting with MCP servers.
 * Demonstrates tool discovery and invocation in a practical setting.
 */

import * as readline from 'readline';
import { MCPClient, MCPTool } from '../src/index.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  // Get server command from args or use default
  const serverCommand = process.argv[2] || 'npx';
  const serverArgs = process.argv.slice(3);

  if (serverArgs.length === 0) {
    console.log('Usage: npx tsx examples/interactive-cli.ts <command> [args...]');
    console.log('Example: npx tsx examples/interactive-cli.ts node ./mcp-server/dist/index.js');
    process.exit(1);
  }

  const client = new MCPClient({
    command: serverCommand,
    args: serverArgs,
    debug: false,
  });

  let tools: MCPTool[] = [];

  try {
    console.log(`Connecting to MCP server: ${serverCommand} ${serverArgs.join(' ')}`);
    await client.connect();
    console.log('Connected!\n');

    // Load available tools
    tools = await client.listTools();
    console.log(`Available tools (${tools.length}):`);
    tools.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name} - ${tool.description || 'No description'}`);
    });
    console.log('');

    // Interactive loop
    while (true) {
      const input = await prompt('> ');
      const trimmed = input.trim();

      if (!trimmed) continue;

      // Handle commands
      if (trimmed === 'quit' || trimmed === 'exit') {
        break;
      }

      if (trimmed === 'help') {
        console.log('Commands:');
        console.log('  tools     - List available tools');
        console.log('  call      - Call a tool interactively');
        console.log('  resources - List resources (if available)');
        console.log('  prompts   - List prompts (if available)');
        console.log('  quit      - Exit the CLI');
        continue;
      }

      if (trimmed === 'tools') {
        tools = await client.listTools();
        tools.forEach((tool, i) => {
          console.log(`${i + 1}. ${tool.name}`);
          console.log(`   ${tool.description || 'No description'}`);
          if (tool.inputSchema.properties) {
            const props = Object.keys(tool.inputSchema.properties);
            const required = tool.inputSchema.required || [];
            console.log(`   Parameters: ${props.map((p) => (required.includes(p) ? `${p}*` : p)).join(', ')}`);
          }
        });
        continue;
      }

      if (trimmed === 'resources') {
        try {
          const resources = await client.listResources();
          if (resources.length === 0) {
            console.log('No resources available');
          } else {
            resources.forEach((r) => {
              console.log(`${r.name}: ${r.uri}`);
            });
          }
        } catch {
          console.log('Resources not supported by this server');
        }
        continue;
      }

      if (trimmed === 'prompts') {
        try {
          const prompts = await client.listPrompts();
          if (prompts.length === 0) {
            console.log('No prompts available');
          } else {
            prompts.forEach((p) => {
              console.log(`${p.name}: ${p.description || 'No description'}`);
            });
          }
        } catch {
          console.log('Prompts not supported by this server');
        }
        continue;
      }

      if (trimmed === 'call') {
        // Interactive tool calling
        const toolName = await prompt('Tool name: ');
        const tool = tools.find((t) => t.name === toolName.trim());

        if (!tool) {
          console.log(`Unknown tool: ${toolName}`);
          continue;
        }

        // Collect arguments
        const args: Record<string, unknown> = {};
        const properties = tool.inputSchema.properties || {};
        const required = tool.inputSchema.required || [];

        for (const [propName, propSchema] of Object.entries(properties)) {
          const schema = propSchema as { type?: string; description?: string };
          const isRequired = required.includes(propName);
          const promptText = `${propName}${isRequired ? '*' : ''} (${schema.type || 'any'}): `;

          const value = await prompt(promptText);
          if (value.trim()) {
            // Parse based on type
            if (schema.type === 'number') {
              args[propName] = parseFloat(value);
            } else if (schema.type === 'boolean') {
              args[propName] = value.toLowerCase() === 'true';
            } else if (schema.type === 'object' || schema.type === 'array') {
              try {
                args[propName] = JSON.parse(value);
              } catch {
                args[propName] = value;
              }
            } else {
              args[propName] = value;
            }
          }
        }

        // Call the tool
        console.log(`\nCalling ${toolName}...`);
        try {
          const result = await client.callTool(toolName.trim(), args);

          if (result.isError) {
            console.log('Error:', result.content);
          } else {
            console.log('Result:');
            result.content.forEach((c) => {
              if (c.type === 'text' && c.text) {
                // Try to pretty-print JSON
                try {
                  const parsed = JSON.parse(c.text);
                  console.log(JSON.stringify(parsed, null, 2));
                } catch {
                  console.log(c.text);
                }
              } else {
                console.log(c);
              }
            });
          }
        } catch (error) {
          console.log('Call failed:', error);
        }
        continue;
      }

      // Try to parse as "toolName arg1 arg2" shorthand
      const parts = trimmed.split(/\s+/);
      const toolName = parts[0];
      const tool = tools.find((t) => t.name === toolName);

      if (tool) {
        // Quick call with positional args
        const properties = Object.keys(tool.inputSchema.properties || {});
        const args: Record<string, unknown> = {};

        parts.slice(1).forEach((arg, i) => {
          if (properties[i]) {
            args[properties[i]] = arg;
          }
        });

        try {
          const result = await client.callTool(toolName, args);
          result.content.forEach((c) => {
            if (c.type === 'text' && c.text) {
              try {
                console.log(JSON.stringify(JSON.parse(c.text), null, 2));
              } catch {
                console.log(c.text);
              }
            }
          });
        } catch (error) {
          console.log('Error:', error);
        }
      } else {
        console.log(`Unknown command or tool: ${trimmed}`);
        console.log('Type "help" for available commands');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
    rl.close();
    console.log('Goodbye!');
  }
}

main();
