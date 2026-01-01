/**
 * MCP Client Example
 *
 * A reference implementation for connecting to MCP (Model Context Protocol) servers.
 */

export { MCPClient, createMCPClient } from './client.js';
export type {
  MCPClientConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  ToolCallResult,
  ServerCapabilities,
  TransportType,
} from './types.js';
