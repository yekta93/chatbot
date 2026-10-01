import { AR_DOCUMENTS_GET_DOCUMENTS, AR_DOCUMENTS_GET_DOCUMENTS_DISPLAY, AR_GROUPS_GET_PAGE } from "@/constants/api";
import getRouterBasename from "@/lib/router";
import { groupDataReducer, GroupDataState } from "@/reducer/groupDataReducer";
import { groupDataState } from "@/types";
import { organizationDocument } from "@/types/organizationData";
import React, { createContext, ReactNode, useContext, useReducer } from "react";
import { useCookies } from "react-cookie";
import { toast } from 'react-toastify';

interface GroupDataProviderProps {
  children: ReactNode;
}

export const GroupData = createContext(GroupDataState);
export const GroupDataProvider: React.FC<GroupDataProviderProps> = ({
  children
}) => {
  const [state, dispatch] = useReducer(groupDataReducer, GroupDataState);
  const [cookies] = useCookies();

  const setGroups = async (groups: string, personal: boolean) => {
    const response = await fetch(`${AR_GROUPS_GET_PAGE}/${groups}?personal=${personal}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    }).then((res) => res)

    const data = await response.json()
    
    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg, {
        position: 'bottom-right'
      })
    }
    else
      dispatch({
        type: 'ADD_GROUPS',
        payload: data
      })
  }

  const setDocuments = async ({ group_id, doc_id }: organizationDocument) => {
    const response = await fetch(`${AR_DOCUMENTS_GET_DOCUMENTS}/${doc_id}?group_id=${group_id}&limit=100`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      }
    }).then((res) => res)

    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg, {
        position: 'bottom-right'
      })
    }
    else
      dispatch({
        type: 'ADD_DOCUMENTS',
        payload: data
      })
  }

  const setDisplays = async ({ group_id, doc_id, partial }: organizationDocument) => {
    const response = await fetch(`${AR_DOCUMENTS_GET_DOCUMENTS_DISPLAY}/?${group_id && `group_id=${group_id}&`}${doc_id && `doc_id=${doc_id}&`}partial=${partial}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    }).then((res) => res)

    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg, {
        position: 'bottom-right'
      })
    }
    else
      dispatch({
        type: 'ADD_DISPLAYS',
        payload: data
      })
  }

  const setPreviewDocument = async ({ doc_id, personal }: organizationDocument) => {
    const response = await fetch(`${AR_DOCUMENTS_GET_DOCUMENTS}/${doc_id}/?personal=${personal}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    }).then((res) => res)

    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail[0].msg, {
        position: 'bottom-right'
      })
    }
    else
      dispatch({
        type: 'ADD_DOCUMENT',
        payload: data
      })
  }

  const value: groupDataState = {
    documents: state.documents,
    previewedDocument: state.previewedDocument,
    groups: state.groups,
    displays: state.displays,
    setPreviewDocument,
    setDocuments,
    setGroups,
    setDisplays,
  };

  return (
    <GroupData.Provider value={value}>{children}</GroupData.Provider>
  );
};

const useGroupData = () => {
  const context = useContext(GroupData);

  if (context === undefined)
    throw new Error("useGroupData must be used within GroupData");

  return context;
};

export default useGroupData;
