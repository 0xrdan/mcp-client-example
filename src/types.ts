/**
 * MCP Client Types
 */

export interface MCPClientConfig {
  /** Server command to spawn (for stdio transport) */
  command?: string;
  /** Arguments for the server command */
  args?: string[];
  /** Environment variables for the server process */
  env?: Record<string, string>;
  /** SSE endpoint URL (for SSE transport) */
  sseUrl?: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface ToolCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface ServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export type TransportType = 'stdio' | 'sse';
