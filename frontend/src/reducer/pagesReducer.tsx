import { pagesState } from "@/types";

export const PagesState: pagesState = {
  activePage: '',
  menuOpen: false,
  setActivePage: () => { },
  setMenuOpen: () => { }
};

interface IAction {
  type: string;
  payload: any;
}

export const PagesReducer = (
  state: pagesState,
  action: IAction
): pagesState => {
  const { type, payload } = action;

  switch (type) {
    case "SET_ACTIVE_PAGE":
      return {
        ...state,
        activePage: payload,
      };
    case "SET_MENU_OPEN":
      return {
        ...state,
        menuOpen: payload,
      };
    default:
      return state;
  }
};