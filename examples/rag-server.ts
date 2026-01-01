/**
 * Connect to MCP RAG Server
 *
 * This example shows how to connect to the mcp-rag-server
 * and perform RAG queries.
 *
 * Prerequisites:
 * - Clone and build mcp-rag-server: https://github.com/0xrdan/mcp-rag-server
 * - Set environment variables (CHROMA_URL, OPENAI_API_KEY, etc.)
 */

import { MCPClient } from '../src/index.js';

async function main() {
  // Connect to the RAG server via stdio
  const client = new MCPClient({
    command: 'node',
    args: ['path/to/mcp-rag-server/dist/index.js'],
    env: {
      ...process.env,
      CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      COLLECTION_NAME: process.env.COLLECTION_NAME || 'documents',
    },
    debug: true,
  });

  try {
    console.log('Connecting to MCP RAG Server...\n');
    await client.connect();

    // List available tools
    const tools = await client.listTools();
    console.log('Available RAG tools:');
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Example: Query the RAG system
    console.log('\n--- Performing RAG Query ---');
    const queryResult = await client.callTool('rag_query', {
      query: 'How does the authentication system work?',
      topK: 5,
      threshold: 0.7,
    });

    if (queryResult.isError) {
      console.error('Query failed:', queryResult.content);
    } else {
      console.log('Query result:');
      queryResult.content.forEach((c) => {
        if (c.type === 'text' && c.text) {
          const result = JSON.parse(c.text);
          console.log(`  Answer: ${result.answer}`);
          console.log(`  Sources: ${result.sources?.length || 0} documents`);
          console.log(`  Confidence: ${result.confidence}`);
        }
      });
    }

    // Example: Search for similar documents
    console.log('\n--- Searching Documents ---');
    const searchResult = await client.callTool('rag_search', {
      query: 'authentication',
      topK: 3,
    });

    if (!searchResult.isError) {
      console.log('Search results:');
      searchResult.content.forEach((c) => {
        if (c.type === 'text' && c.text) {
          const results = JSON.parse(c.text);
          results.forEach((doc: { source: string; score: number; excerpt: string }) => {
            console.log(`  - ${doc.source} (score: ${doc.score.toFixed(3)})`);
            console.log(`    "${doc.excerpt.substring(0, 100)}..."`);
          });
        }
      });
    }

    // Example: Get collection stats
    console.log('\n--- Collection Stats ---');
    const statsResult = await client.callTool('get_stats', {});

    if (!statsResult.isError) {
      statsResult.content.forEach((c) => {
        if (c.type === 'text' && c.text) {
          const stats = JSON.parse(c.text);
          console.log(`  Collection: ${stats.collection}`);
          console.log(`  Document count: ${stats.documentCount}`);
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
    console.log('\nDisconnected from RAG server');
  }
}

main();
