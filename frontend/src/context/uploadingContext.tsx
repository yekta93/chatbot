import { AR_UPLOAD_FILE_, AR_UPLOAD_HISTORY, AR_UPLOAD_STATUS } from "@/constants/api";
import getRouterBasename from "@/lib/router";
import { UploadingReducer, UploadingState } from "@/reducer/uploadingReducer";
import { uploadingFile, uploadingState } from "@/types";
import React, { createContext, useContext, useReducer } from "react";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";

export const UploadingContext = createContext(UploadingState);

export const UploadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(UploadingReducer, UploadingState);
  const [cookies] = useCookies();
  
  const setModalState = (state: boolean) => {
    dispatch({
      type: 'SET_MODAL_STATE',
      payload: state
    })
  }

  const setUploadingFilesHistory = async (limit: number) => {
    const response = await fetch(`${AR_UPLOAD_HISTORY}/?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    }).then((res) => res)

    const data = await response.json()

    if (response.status === 401){
      window.location.href = getRouterBasename() + '/auth'
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg, {
        position: 'bottom-right'
      })
    }
    else
      dispatch({
        type: 'SET_UPLOADING_FILES',
        payload: data
      })
  }

  const setUploadingFile = async (doc_id: string) => {
    const response = await fetch(`${AR_UPLOAD_STATUS}/${doc_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    }).then((res) => res)

    const data = await response.json()

    if (response.status === 401){
      window.location.href = getRouterBasename() + '/auth'
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg,{
        position: 'bottom-right'
      })
      return null
    }
    else {
      dispatch({
        type: 'SET_UPLOADING_FILE',
        payload: data
      })
      return data
    }
  }

  const setUploadingFiles = (uploadingFiles: uploadingFile[], changingFile: uploadingFile) => {
    uploadingFiles[uploadingFiles.findIndex((item) => item.doc_id === changingFile.doc_id)] = changingFile;
    dispatch({
      type: 'SET_UPLOADING_FILE',
      payload: uploadingFiles
    })
  }

  const uploadFile = async (doc: File,name: string) => {
    const form = new FormData();
    form.append('file', doc, name);

    const response = await fetch(`${AR_UPLOAD_FILE_}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
      body: form
    }).then((res) => res)

    const data = await response.json()
  
    if (response.status === 401){
      window.location.href = getRouterBasename() + '/auth'
    }
    if (response.status !== 200) {
      toast.error(data.detail,{
        position: 'bottom-right'
      })
      return ''
    }
    else {
      toast.info("فایل شما توسط دانایار درحال پردازش است.", {
        rtl: true,
        position: 'bottom-right'
      })
      return data.doc_id
    }
  }

  const value: uploadingState = {
    modalState: state.modalState,
    uploadingFileStatus: state.uploadingFileStatus,
    uploadingFiles: state.uploadingFiles,
    setUploadingFilesHistory,
    setUploadingFiles,
    setUploadingFile,
    setModalState,
    uploadFile
  };

  return (
    <UploadingContext.Provider value={value}>{children}</UploadingContext.Provider>
  );
};

const useUploading = () => {
  const context = useContext(UploadingContext);

  if (context === undefined)
    throw new Error("useUploading must be used within UploadingContext");

  return context;
};

export default useUploading;
