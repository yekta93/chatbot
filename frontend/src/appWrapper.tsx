import { useEffect } from 'react';

import {
  useChatInteract,
} from '@chainlit/react-client';
import App from './app';

export default function AppWrapper() {
  const { windowMessage } = useChatInteract();

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      windowMessage(event.data);
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [windowMessage]);

  return <App />;
}