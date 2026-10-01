import { cn } from '@/lib/utils';
import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { useAuth, useChatSession, useConfig } from '@chainlit/react-client';

import { router } from './routes';
import { MdCircularProgress } from './material';

declare global {
  interface Window {
    cl_shadowRootElement?: HTMLDivElement;
    transports?: string[];
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  }
}

function App() {
  const { config } = useConfig();

  const { isAuthenticated, isReady } = useAuth();
  const { chatProfile, setChatProfile } = useChatSession();

  const configLoaded = !!config;


  useEffect(() => {
    if (
      !configLoaded ||
      !config ||
      !config.chatProfiles?.length ||
      chatProfile
    ) {
      return;
    }

    const defaultChatProfile = config.chatProfiles.find(
      (profile) => profile.default
    );

    if (defaultChatProfile) {
      setChatProfile(defaultChatProfile.name);
    } else {
      setChatProfile(config.chatProfiles[0].name);
    }
  }, [configLoaded, config, chatProfile, setChatProfile]);

  if (!configLoaded && isAuthenticated) return null;

  return (
    <div>
      <Suspense fallback={
        <div
          className={cn(
            'layout bg-surface flex items-center justify-center fixed size-full p-2 top-0',
            isReady && 'hidden'
          )}
        >
          <MdCircularProgress indeterminate className="!size-32" />
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    </div>
  );
}

export default App;