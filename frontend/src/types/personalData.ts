import { genericObject } from "."

export type uploadedStates = "done" | "processing" | "failed"
export type uploadedFileType = "pdf" | "txt" | "mp3"
export type uploadedFieldType = "text" | "date" | "status" | "type" | "hidden"

export interface uploadedFileRow {
  id: string,
  name: string,
  status: string,
  file_type: string,
  creation_ts: string,
}

export interface uploadedFile {
  doc_id: string,
  name: string,
  creation_ts: string,
  status: genericObject<string>[],
  number_total_steps: 0,
  state: uploadedStates
}


export interface fileDisplay {
  title: string,
  key: keyof uploadedFile | 'file_type',
  type: uploadedFieldType,
  width: number
}

export type fileDisplays = fileDisplay[];