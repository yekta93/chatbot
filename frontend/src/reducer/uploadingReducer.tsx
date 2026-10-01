import { uploadingFile, uploadingState } from "@/types";

const initial_uploading_status: uploadingFile = {
  doc_id: "",
  name: "",
  creation_ts: "",
  status: [],
  number_total_steps: 0,
  state: "processing"
}

export const UploadingState: uploadingState = {
  modalState: false,
  uploadingFiles: [],
  uploadingFileStatus: initial_uploading_status,
  setUploadingFile: async () => initial_uploading_status,
  setUploadingFilesHistory: () => { },
  setUploadingFiles: () => { },
  setModalState: () => { },
  uploadFile: async () => ''
};

interface IAction {
  type: string;
  payload: any;
}

export const UploadingReducer = (
  state: uploadingState,
  action: IAction
): uploadingState => {
  const { type, payload } = action;

  switch (type) {
    case "SET_MODAL_STATE":
      return {
        ...state,
        modalState: payload,
      };
    case "SET_FETCHED_UPLOADING_FILES":
      return {
        ...state,
        uploadingFiles: payload,
      };
    case "SET_UPLOADING_FILES":
      return {
        ...state,
        uploadingFiles: payload,
      };
    case "SET_UPLOADING_FILE":
      return {
        ...state,
        uploadingFileStatus: payload,
      };
    default:
      return state;
  }
};