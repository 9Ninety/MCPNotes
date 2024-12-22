export enum ToolName {
  LIST_NOTES = "listNotes",
  GET_NOTE = "getNote",
  WRITE_NOTE = "writeNote",
  DELETE_NOTE = "deleteNote",
}

export enum ResourceNme {
  NOTE = "note",
}

export interface Resource {
  uri: string;
  name: string;
  mimeType: string;
  text?: string;
  blob?: string;
}
