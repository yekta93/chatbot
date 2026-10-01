import { PagesReducer, PagesState } from "@/reducer/pagesReducer";
import { pagesState } from "@/types";
import React, { createContext, useContext, useReducer } from "react";

export const PagesContext = createContext(PagesState);

export const PagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(PagesReducer, PagesState);

  const setActivePage = (page: string) => {
    dispatch({
      type: 'SET_ACTIVE_PAGE',
      payload: page
    })
  }
  const setMenuOpen = (state: boolean) => {
    dispatch({
      type: 'SET_MENU_OPEN',
      payload: state
    })
  }
  const value: pagesState = {
    activePage: state.activePage,
    menuOpen: state.menuOpen,
    setActivePage,
    setMenuOpen,
  };

  return (
    <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
  );
};

const usePages = () => {
  const context = useContext(PagesContext);

  if (context === undefined)
    throw new Error("usePages must be used within PagesContext");

  return context;
};

export default usePages;
