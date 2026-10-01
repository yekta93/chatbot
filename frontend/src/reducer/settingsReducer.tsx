import { settingsState } from "@/types";

export const SettingsState: settingsState = {
  settingOpen: false,
  currentTheme: '',
  setCurrentTheme: () => { },
  setSettingOpen: () => { }
};

interface IAction {
  type: string;
  payload: any;
}

export const SettingsReducer = (
  state: settingsState,
  action: IAction
): settingsState => {
  const { type, payload } = action;

  switch (type) {
    case "SET_ISOPEN":
      return {
        ...state,
        settingOpen: payload,
      };
    case "SET_THEME":
      return {
        ...state,
        currentTheme: payload,
      };
    default:
      return state;
  }
};
