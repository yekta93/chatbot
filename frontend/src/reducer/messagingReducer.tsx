import { messagingState } from "@/types";

export const MessagingState: messagingState = {
  threadedMessages: [],
  messagedElement: {
      type: "text",
      for_id: null ,
      id: '',
      src: null
  },
  setMessagedElement: () => { },
  setThreadedMessages: () => { }
};

interface IAction {
  type: string;
  payload: any;
}

export const MessagingReducer = (
  state: messagingState,
  action: IAction
): messagingState => {
  const { type, payload } = action;

  switch (type) {
    case "SET_MESSAGED_ELEMENTS":
      return {
        ...state,
        messagedElement: payload,
      };
    case "SET_THREADED_MESSAGES":
      return {
        ...state,
        threadedMessages: payload,
      };
    default:
      return state;
  }
};