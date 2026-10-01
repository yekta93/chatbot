import { MessagingReducer, MessagingState } from "@/reducer/messagingReducer";
import { messagedElement, messagingState } from "@/types";
import React, { createContext, useContext, useReducer } from "react";

export const MessagingContext = createContext(MessagingState);

export const MessagingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(MessagingReducer, MessagingState);

  const setMessagedElement = (element: messagedElement) => {
    dispatch({
      type: 'SET_MESSAGED_ELEMENTS',
      payload: element
    })
  }

  const setThreadedMessages = (message: string) => {
    dispatch({
      type: 'SET_THREADED_MESSAGES',
      payload: message
    })
  }

  const value: messagingState = {
    messagedElement: state.messagedElement,
    threadedMessages: state.threadedMessages,
    setMessagedElement,
    setThreadedMessages,
  };

  return (
    <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
  );
};

const useMessaging = () => {
  const context = useContext(MessagingContext);

  if (context === undefined)
    throw new Error("useMessaging must be used within MessagingContext");

  return context;
};

export default useMessaging;
