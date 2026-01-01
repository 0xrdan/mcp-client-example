/**
 * MCP Client - Connect to MCP servers and invoke tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type {
  MCPClientConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  ToolCallResult,
  ServerCapabilities,
  TransportType,
} from './types.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | SSEClientTransport | null = null;
  private config: MCPClientConfig;
  private connected = false;
  private transportType: TransportType;

  constructor(config: MCPClientConfig) {
    this.config = {
      timeout: 30000,
      debug: false,
      ...config,
    };

    // Determine transport type
    if (config.sseUrl) {
      this.transportType = 'sse';
    } else if (config.command) {
      this.transportType = 'stdio';
    } else {
      throw new Error('Must provide either command (stdio) or sseUrl (SSE)');
    }

    this.client = new Client(
      {
        name: 'mcp-client-example',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<ServerCapabilities> {
    if (this.connected) {
      throw new Error('Already connected');
    }

    try {
      if (this.transportType === 'stdio') {
        this.transport = new StdioClientTransport({
          command: this.config.command!,
          args: this.config.args,
          env: this.config.env,
        });
      } else {
        this.transport = new SSEClientTransport(new URL(this.config.sseUrl!));
      }

      await this.client.connect(this.transport);
      this.connected = true;

      if (this.config.debug) {
        console.log(`[MCP Client] Connected via ${this.transportType}`);
      }

      // Return server capabilities
      const capabilities = this.client.getServerCapabilities();
      return {
        tools: !!capabilities?.tools,
        resources: !!capabilities?.resources,
        prompts: !!capabilities?.prompts,
      };
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect: ${error}`);
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.close();
      this.connected = false;

      if (this.config.debug) {
        console.log('[MCP Client] Disconnected');
      }
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error}`);
    }
  }

  /**
   * List available tools from the server
   */
  async listTools(): Promise<MCPTool[]> {
    this.ensureConnected();

    const response = await this.client.listTools();
    return response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as MCPTool['inputSchema'],
    }));
  }

  /**
   * Call a tool with the given arguments
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
    this.ensureConnected();

    if (this.config.debug) {
      console.log(`[MCP Client] Calling tool: ${name}`, args);
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    return {
      content: response.content as ToolCallResult['content'],
      isError: response.isError,
    };
  }

  /**
   * List available resources from the server
   */
  async listResources(): Promise<MCPResource[]> {
    this.ensureConnected();

    const response = await this.client.listResources();
    return response.resources.map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<string> {
    this.ensureConnected();

    const response = await this.client.readResource({ uri });
    const content = response.contents[0];

    if (content && 'text' in content) {
      return content.text;
    }

    throw new Error('Resource content not available as text');
  }

  /**
   * List available prompts from the server
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    this.ensureConnected();

    const response = await this.client.listPrompts();
    return response.prompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    }));
  }

  /**
   * Get a prompt with the given arguments
   */
  async getPrompt(
    name: string,
    args: Record<string, string> = {}
  ): Promise<{ description?: string; messages: Array<{ role: string; content: string }> }> {
    this.ensureConnected();

    const response = await this.client.getPrompt({
      name,
      arguments: args,
    });

    return {
      description: response.description,
      messages: response.messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : msg.content.map((c) => ('text' in c ? c.text : '')).join(''),
      })),
    };
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the transport type being used
   */
  getTransportType(): TransportType {
    return this.transportType;
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to MCP server. Call connect() first.');
    }
  }
}

/**
 * Helper to create and connect a client in one step
 */
export async function createMCPClient(config: MCPClientConfig): Promise<MCPClient> {
  const client = new MCPClient(config);
  await client.connect();
  return client;
}
