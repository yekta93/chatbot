import { groupDataState } from "@/types";

export const GroupDataState: groupDataState = {
  groups: [],
  displays: {},
  documents: [],
  previewedDocument: {
    doc_id: '',
    name: '',
    creation_ts: '',
    src: '',
    tags: [],
    metadata: {}
  },
  setPreviewDocument: () => { },
  setGroups: () => { },
  setDisplays: () => { },
  setDocuments: () => { },
};

interface IAction {
  type: string;
  payload: any;
}

export const groupDataReducer = (
  state: groupDataState,
  action: IAction
): groupDataState => {
  const { type, payload } = action;

  switch (type) {
    case "ADD_GROUPS":
      return {
        ...state,
        groups: payload,
      };
    case "ADD_DOCUMENTS":
      return {
        ...state,
        documents: payload,
      };
    case "ADD_DOCUMENT":
      return {
        ...state,
        previewedDocument: payload,
      };
    case "ADD_DISPLAYS":
      return {
        ...state,
        displays: payload,
      };
    default:
      return state;
  }
};
