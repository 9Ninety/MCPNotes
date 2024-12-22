import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ListNotesInputSchema,
  GetNoteInputSchema,
  WriteNoteInputSchema,
  DeleteNoteInputSchema,
} from "./schemas.js";
import { ToolName } from "./types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

export const getTools = (): Tool[] => [
  {
    name: ToolName.LIST_NOTES,
    description:
      "Lists all notes, or search notes with tags you seen in previous list operation.",
    inputSchema: zodToJsonSchema(ListNotesInputSchema) as Tool["inputSchema"],
  },
  {
    name: ToolName.GET_NOTE,
    description: "Retrieves a specific note by its ID.",
    inputSchema: zodToJsonSchema(GetNoteInputSchema) as Tool["inputSchema"],
  },
  {
    name: ToolName.WRITE_NOTE,
    description:
      "Creates or updates a note with a unique ID suffixed by a random number.",
    inputSchema: zodToJsonSchema(WriteNoteInputSchema) as Tool["inputSchema"],
  },
  {
    name: ToolName.DELETE_NOTE,
    description: "Deletes a specific note by its ID.",
    inputSchema: zodToJsonSchema(DeleteNoteInputSchema) as Tool["inputSchema"],
  },
];
