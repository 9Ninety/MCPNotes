import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  Tool,
  UnsubscribeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getVersion } from "../utils/version.js";
import { createDynamoDBClients, DynamoDBConfig } from "./config.js";
import {
  handleDeleteNote,
  handleGetNote,
  handleListNotes,
  handleWriteNote,
} from "./handlers.js";
import {
  DeleteNoteInputSchema,
  GetNoteInputSchema,
  ListNotesInputSchema,
  Note,
  WriteNoteInputSchema,
} from "./schemas.js";
import { getTools } from "./tools.js";
import { Resource, ToolName } from "./types.js";
import { parseCursor } from "./utils.js";

const PAGE_SIZE = 20;

export const createNotesServer = async (dynamoDBConfig: DynamoDBConfig) => {
  const { docClient } = createDynamoDBClients(dynamoDBConfig);
  const tableName = dynamoDBConfig.tableName;

  const server = new Server(
    {
      name: "MCP Notes",
      version: await getVersion(),
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: true },
        logging: {},
      },
    }
  );

  let subscriptions: Set<string> = new Set();
  const ALL_RESOURCES: Resource[] = [];

  const updateInterval = setInterval(() => {
    for (const uri of subscriptions) {
      server.notification({
        method: "notifications/resources/updated",
        params: { uri },
      });
    }
  }, 5000);

  const initializeResources = async () => {
    try {
      const command = new ScanCommand({ TableName: tableName });
      const response = await docClient.send(command);
      const notes = (response.Items as Note[]) || [];
      notes.forEach((note) => {
        ALL_RESOURCES.push({
          uri: `notes://notes/${note.id}`,
          name: note.title,
          mimeType: "application/json",
          text: JSON.stringify(note),
        });
      });
    } catch (error) {
      console.error("DynamoDB error during resource initialization:", error);
    }
  };

  initializeResources();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = getTools();
    return { tools };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    const cursor = request.params?.cursor;
    let startIndex = parseCursor(cursor);

    const endIndex = Math.min(startIndex + PAGE_SIZE, ALL_RESOURCES.length);
    const resources = ALL_RESOURCES.slice(startIndex, endIndex);

    let nextCursor: string | undefined;
    if (endIndex < ALL_RESOURCES.length) {
      nextCursor = Buffer.from(endIndex.toString()).toString("base64");
    }

    return { resources, nextCursor };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = ALL_RESOURCES.find(
      (res) => res.uri === request.params.uri
    );
    if (!resource) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }
    return { contents: [resource] };
  });

  server.setRequestHandler(SubscribeRequestSchema, async (request) => {
    subscriptions.add(request.params.uri);
    return {};
  });

  server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
    subscriptions.delete(request.params.uri);
    return {};
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case ToolName.LIST_NOTES: {
        const { tags } = ListNotesInputSchema.parse(args);
        return handleListNotes(docClient, tableName, ALL_RESOURCES, tags);
      }

      case ToolName.GET_NOTE: {
        const { id: getNoteId } = GetNoteInputSchema.parse(args);
        return handleGetNote(docClient, tableName, getNoteId);
      }

      case ToolName.WRITE_NOTE: {
        const note = WriteNoteInputSchema.parse(args);
        return handleWriteNote(docClient, tableName, note, ALL_RESOURCES);
      }

      case ToolName.DELETE_NOTE: {
        const { id: deleteNoteId } = DeleteNoteInputSchema.parse(args);
        return handleDeleteNote(
          docClient,
          tableName,
          deleteNoteId,
          ALL_RESOURCES
        );
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const cleanup = async () => {
    clearInterval(updateInterval);
  };

  return { server, cleanup };
};
