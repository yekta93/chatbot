import { AR_AUTH_GET_TOKEN, AR_AUTH_SEND_VALIDATION_CODE } from "@/constants/api";
import getRouterBasename from "@/lib/router";
import { authenticationState, authGetToken } from "@/types";
import React, { createContext, useContext} from "react";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";

const AuthenticationState: authenticationState = {
  getToken: async () => false,
  sendValidationCode: async () => false,
};

export const AuthContext = createContext(AuthenticationState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [cookies, setCookie] = useCookies();
  
  const getToken = async ({ username, password }: authGetToken) => {
    const response = await fetch(`${AR_AUTH_GET_TOKEN}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      },
      body: new URLSearchParams({
        username: username,
        password: password,
      })
    })

    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail, {
        position: 'bottom-right'
      })

      return false
    }
      setCookie('danayar_access_token' , data.access_token , {
        // httpOnly: true, TODO : change this to true
        path: '/',
        sameSite: true
      })
    
    return response.ok
  }

  const sendValidationCode = async (phoneNum: string) => {
    const response = await fetch(`${AR_AUTH_SEND_VALIDATION_CODE}/?phone_num=${phoneNum}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      }
    ,})
    const data = await response.json()

    if (response.status === 401) {
      window.location.href = getRouterBasename() + '/auth';
    }
    if (response.status !== 200) {
      toast.error(data.detail, {
        position: 'bottom-right'
      })

      return false
    }
    
    return data
  }


  const value: authenticationState = {
    getToken,
    sendValidationCode,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error("useAuth must be used within AuthContext");

  return context;
};

export default useAuth;
