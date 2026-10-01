import { organizationDocument } from "./organizationData"

export type genericObject<T> = {
  [key: string]: T;
}

export type settingsState = {
  settingOpen: boolean,
  currentTheme: string,
  setSettingOpen: (state: boolean) => void
  setCurrentTheme: (theme: string) => void
}

export type group = {
  group_id: string,
  name: string,
  description: string,
  type: 'DashboardGroup',
  resolve_to: 'groups' | 'documents'
}

export type document = {
  doc_id: string,
  name: string,
  creation_ts: string,
  src: string,
  tags: string[],
  metadata: genericObject<string>
}

export type groupDataState = {
  displays: genericObject<genericObject<string>>
  groups: group[]
  documents: document[]
  previewedDocument: document
  setGroups: (groups: string, personal: boolean) => void
  setDisplays: ({ group_id, doc_id, partial }: organizationDocument) => void
  setDocuments: ({ group_id, doc_id }: organizationDocument) => void
  setPreviewDocument: ({ doc_id, personal }: organizationDocument) => void

}

export type messagedElement = {
  type: "image" | "audio" | "text" | "plotly" | "document" | "documents" | "table",
  for_id: null | string,
  id: string,
  src: null | genericObject<string>[] | string
}

export type messagingState = {
  threadedMessages: string
  messagedElement: messagedElement,
  setMessagedElement: (element: messagedElement) => void
  setThreadedMessages: (messages: string) => void
}

export type uploadingFile = {
  doc_id: string,
  name: string,
  creation_ts: string,
  status: {
    name: string,
    start_ts: string,
    error: string
  }[],
  number_total_steps: number,
  state: "done" | "failed" | "processing"
}

export type uploadingState = {
  modalState: boolean,
  uploadingFiles: uploadingFile[]
  uploadingFileStatus: uploadingFile
  setUploadingFilesHistory: (limit: number) => void
  setUploadingFiles: (uploadingFiles : uploadingFile[], changingFile: uploadingFile) => void,
  setUploadingFile: (doc_id: string) => Promise<uploadingFile | null>
  uploadFile: (doc: File, name: string) => Promise<string>;
  setModalState: (state: boolean) => void
}

export type pagesState = {
  menuOpen: boolean,
  setMenuOpen: (state: boolean) => void,
  activePage: string,
  setActivePage: (page: string) => void
}

export type signedUpUser = {
  fname: string
  lname: string
  phoneNum: string
}

export type activatedUser = {
  phoneNum: string,
  validationCode: string
}

export type userState = {
  fname: string,
  lname: string,
  phoneNum: string,
  setFname: (fname: string) => void,
  setLname: (lname: string) => void,
  setPhoneNum: (phoneNum: string) => void,
  getUser: () => Promise<signedUpUser>
  removeUser: (phoneNum: string) => Promise<boolean>
  signUpUser: (user: signedUpUser) => Promise<boolean>
}

export type authGetToken = { username: string, password: string }

export type authenticationState = {
  getToken: ({ username, password }: authGetToken) => Promise<boolean> //the return of API is access token but thats going to get saved in Cookies immediately in the context function call
  sendValidationCode: (phoneNum: string) => Promise<boolean>,
}