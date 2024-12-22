import { z } from "zod";

export const NoteSchema = z.object({
  id: z
    .string()
    .describe(
      'Unique identifier of the note, should be unique enough like "a-note-about-python-file-server-design-109".'
    ),
  title: z
    .string()
    .describe("Title of the note, describe what was inside the content."),
  summary: z.string().describe("Short summary of the note"),
  tags: z.array(z.string()).describe("Tags of the note"),
  content: z.string().describe("Content of the note"),
});

export type Note = z.infer<typeof NoteSchema>;
