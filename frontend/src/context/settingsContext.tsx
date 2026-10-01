import { SettingsReducer, SettingsState } from "@/reducer/settingsReducer";
import { settingsState } from "@/types";
import React, { createContext, useContext, useReducer } from "react";
import { useCookies } from "react-cookie";

export const SettingsContext = createContext(SettingsState);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(SettingsReducer, SettingsState);
  const [, setCookies] = useCookies();

  const setSettingOpen = (state: boolean) => {
    dispatch({
      type: 'SET_ISOPEN',
      payload: state
    })
  }

  const setCurrentTheme = (theme: string) => {
    setCookies('theme', theme)

    dispatch({
      type: 'SET_THEME',
      payload: theme
    })
  }


  const value: settingsState = {
    settingOpen: state.settingOpen,
    currentTheme: state.currentTheme,
    setCurrentTheme,
    setSettingOpen,
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

const useSettings = () => {
  const context = useContext(SettingsContext);

  if (context === undefined)
    throw new Error("useSettings must be used within settingsContext");

  return context;
};

export default useSettings;
