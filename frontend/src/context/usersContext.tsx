import { AR_USERS_DELETE_USER, AR_USERS_GET_USER, AR_USERS_SIGNUP } from "@/constants/api";
import getRouterBasename from "@/lib/router";
import { UsersReducer, UsersState } from "@/reducer/usersReducer";
import { signedUpUser, userState } from "@/types";
import React, { createContext, useContext, useReducer } from "react";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";

export const UsersContext = createContext(UsersState);

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(UsersReducer, UsersState)
  const [cookies] = useCookies();

  const setFname = (fname: string) => {
    dispatch({
      type: 'SET_USER',
      payload: {
        fname: fname,
        lname: state.lname,
        phoneNum: state.phoneNum
      }
    })
  }

  const setLname = (lname: string) => {
    dispatch({
      type: 'SET_USER',
      payload: {
        fname: state.fname,
        lname: lname,
        phoneNum: state.phoneNum
      }
    })
  }

  const setPhoneNum = (phoneNum: string) => {
    dispatch({
      type: 'SET_USER',
      payload: {
        fname: state.fname,
        lname: state.lname,
        phoneNum: phoneNum
      }
    })
  }

  const getUser = async () => {
    const response = await fetch(`${AR_USERS_GET_USER}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cookies.danayar_access_token}`
        },
      }
    )
    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }

    if (response.status !== 200) {
      toast.error(data.detail, {
        position: 'bottom-right'
      })

      return false;
    }

    dispatch({
      type: 'SET_USER',
      payload: { 
        fname: data.fname,
        lname: data.lname,
        phoneNum: data.phone_num
      }
    })
    return data;
  }

  const removeUser = async (phone_num: string) => {
    const response = await fetch(`${AR_USERS_DELETE_USER}/${phone_num}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    })
    const data = await response.json()

    if (response.status !== 200) {
      toast.error(data.detail, {
        position: 'bottom-right'
      })

      return false;
    }

    await getUser()
    return data
  }

  const signUpUser = async (user: signedUpUser) => {
    const response = await fetch(`${AR_USERS_SIGNUP}/?phone_num=${user.phoneNum}&fname=${user.fname}&lname=${user.lname}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
    })
    const data = await response.json()

    if (response.status !== 200) {
      toast.error(data.detail, {
        position: 'bottom-right'
      })

      return false;
    }

    dispatch({
      type: 'SET_USER',
      payload: { ...data }
    })

    return response.ok
  }

  const value: userState = {
    fname: state.fname,
    lname: state.lname,
    phoneNum: state.phoneNum,
    setFname,
    setLname,
    setPhoneNum,
    getUser,
    removeUser,
    signUpUser,
  };

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
};

const useUsers = () => {
  const context = useContext(UsersContext);

  if (context === undefined)
    throw new Error("useUsers must be used within UsersContext");

  return context;
};

export default useUsers;
