# MCP Client Example

A reference implementation for connecting to MCP (Model Context Protocol) servers.

> *This is a companion to [mcp-rag-server](https://github.com/0xrdan/mcp-rag-server), demonstrating client-side MCP integration.*

---

## The Problem

You want to connect to MCP servers but:

- **SDK documentation is sparse** — the protocol is new, examples are few
- **Transport handling is complex** — stdio vs SSE, connection lifecycle
- **Tool discovery needs patterns** — listing, calling, handling responses
- **Error handling varies** — different servers, different behaviors

## The Solution

MCP Client Example provides:

- **Clean client wrapper** — connect, discover, invoke in a few lines
- **Multiple transports** — stdio (subprocess) and SSE (HTTP) support
- **Type-safe API** — full TypeScript definitions
- **Working examples** — basic usage, RAG integration, interactive CLI

```typescript
import { MCPClient } from '@danmonteiro/mcp-client-example';

const client = new MCPClient({
  command: 'node',
  args: ['./mcp-server/dist/index.js'],
});

await client.connect();
const tools = await client.listTools();
const result = await client.callTool('rag_query', { query: 'How does auth work?' });
await client.disconnect();
```

---

## Quick Start

### 1. Install

```bash
npm install @danmonteiro/mcp-client-example
```

### 2. Connect to a Server

```typescript
import { MCPClient } from '@danmonteiro/mcp-client-example';

// Stdio transport (spawn a subprocess)
const client = new MCPClient({
  command: 'npx',
  args: ['-y', '@anthropic/mcp-server-example'],
  debug: true,
});

// OR SSE transport (connect to HTTP endpoint)
const sseClient = new MCPClient({
  sseUrl: 'http://localhost:3000/mcp',
  debug: true,
});

await client.connect();
```

### 3. Discover and Call Tools

```typescript
// List available tools
const tools = await client.listTools();
console.log(tools);
// [{ name: 'rag_query', description: '...', inputSchema: {...} }, ...]

// Call a tool
const result = await client.callTool('rag_query', {
  query: 'What is the architecture?',
  topK: 5,
});

console.log(result.content);
// [{ type: 'text', text: '{"answer": "...", "sources": [...]}' }]
```

### 4. Clean Up

```typescript
await client.disconnect();
```

---

## API Reference

### MCPClient

```typescript
class MCPClient {
  constructor(config: MCPClientConfig);

  // Connection
  connect(): Promise<ServerCapabilities>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getTransportType(): 'stdio' | 'sse';

  // Tools
  listTools(): Promise<MCPTool[]>;
  callTool(name: string, args?: Record<string, unknown>): Promise<ToolCallResult>;

  // Resources
  listResources(): Promise<MCPResource[]>;
  readResource(uri: string): Promise<string>;

  // Prompts
  listPrompts(): Promise<MCPPrompt[]>;
  getPrompt(name: string, args?: Record<string, string>): Promise<PromptResult>;
}
```

### Configuration

```typescript
interface MCPClientConfig {
  // Stdio transport (spawn subprocess)
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // SSE transport (HTTP connection)
  sseUrl?: string;

  // Options
  timeout?: number;  // Connection timeout (default: 30000ms)
  debug?: boolean;   // Enable debug logging
}
```

---

## Examples

### Basic Usage

```bash
npx tsx examples/basic-usage.ts
```

Connects to an MCP server, lists tools, and demonstrates invocation.

### RAG Server Integration

```bash
# Set up mcp-rag-server first
export CHROMA_URL=http://localhost:8000
export OPENAI_API_KEY=sk-...

npx tsx examples/rag-server.ts
```

Shows how to connect to [mcp-rag-server](https://github.com/0xrdan/mcp-rag-server) for RAG queries.

### Interactive CLI

```bash
npx tsx examples/interactive-cli.ts node ./path/to/server.js
```

A REPL for exploring any MCP server interactively.

---

## Use Cases

### With mcp-rag-server

```typescript
const client = new MCPClient({
  command: 'node',
  args: ['./mcp-rag-server/dist/index.js'],
  env: {
    CHROMA_URL: 'http://localhost:8000',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
});

await client.connect();

// Query the RAG system
const result = await client.callTool('rag_query', {
  query: 'How does the authentication system work?',
  topK: 5,
  threshold: 0.7,
});

const data = JSON.parse(result.content[0].text);
console.log(data.answer);
console.log(`Sources: ${data.sources.length}`);
```

### With Claude Desktop

Configure in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-rag": {
      "command": "node",
      "args": ["./mcp-rag-server/dist/index.js"],
      "env": {
        "CHROMA_URL": "http://localhost:8000"
      }
    }
  }
}
```

Then use this client to test the same server programmatically.

---

## Project Structure

```
mcp-client-example/
├── src/
│   ├── index.ts      # Exports
│   ├── client.ts     # MCPClient implementation
│   └── types.ts      # Type definitions
├── examples/
│   ├── basic-usage.ts      # Basic connection example
│   ├── rag-server.ts       # RAG server integration
│   └── interactive-cli.ts  # Interactive REPL
├── package.json
└── README.md
```

---

## Related Projects

- [mcp-rag-server](https://github.com/0xrdan/mcp-rag-server) - MCP server this client connects to
- [rag-pipeline](https://github.com/0xrdan/rag-pipeline) - The RAG backend powering the server
- [ai-orchestrator](https://github.com/0xrdan/ai-orchestrator) - Multi-model routing for AI responses
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/new-feature`)
3. Make changes with semantic commits
4. Open a PR with clear description

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with [Claude Code](https://claude.ai/code).

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
