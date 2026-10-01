import { LandingInputContainer } from '@/components/landing/landingInputContainer/landingInputContianer'
import { DashboardContainer } from '@/components/messaging/elementContainer/messageElementContainer'
import { MessageContainer } from '@/components/messaging/messageContainer/messageContainer'
import AutoResumeThread from '@/components/thread/autoResumeThread'
import useMessaging from '@/context/messagingContext'
import { MdCircularProgress } from '@/material'
import { messagedElement } from '@/types'
import { threadHistoryState, useAuth, useChatData, useChatMessages, useConfig } from '@chainlit/react-client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSetRecoilState } from 'recoil'

const Messaging = () => {
  const [dashboardsExpanded, setDashboardsExpanded] = useState<boolean>(false)
  const { messages } = useChatMessages();
  const { messagedElement, setMessagedElement } = useMessaging();
  const { loading } = useChatData();
  const { threadId } = useChatMessages();
  const { config } = useConfig();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const isCurrentThread = threadId === id;

  useEffect(() => {
    setThreadHistory((prev) => {
      if (prev?.currentThreadId === id) return prev;
      return { ...prev, currentThreadId: id };
    });
  }, [id, setThreadHistory, navigate]);

  const handleDashboardClick = useCallback((element: messagedElement) => {
    setMessagedElement(element);
    setDashboardsExpanded(true);
  }, [])

  useEffect(() => {
    const currentPage = new URL(window.location.href);
    if (
      user &&
      config?.dataPersistence &&
      threadId &&
      currentPage.pathname === '/'
    ) {
      navigate(`/thread/${threadId}`);
    } else {
      setThreadHistory((prev) => ({
        ...prev,
        currentThreadId: threadId
      }));
    }
  }, [config?.dataPersistence, navigate, setThreadHistory, threadId, user]);

  const memoizedChat = useMemo(() =>
    <main className="w-full h-full relative flex flex-row justify-between items-center gap-4 p-4">
      <DashboardContainer messagedElement={messagedElement} setIsExpanded={setDashboardsExpanded} isExpanded={dashboardsExpanded} />

      <div className={` ${dashboardsExpanded ? 'w-[70%] lg:flex hidden' : 'w-full'} transition-all duration-300 ease-in-out h-full relative flex flex-col justify-between items-center`}>
        <MessageContainer
          loading={loading}
          messages={messages}
          handleDashboardClick={(element) => handleDashboardClick(element)}
        />

        <div className="xl:w-1/2 w-full min-w-[30vw] h-fit rounded-[5rem] flex flex-row justify-center items-center gap-2">
          <LandingInputContainer />
        </div>
      </div>
    </main >
  , [dashboardsExpanded, handleDashboardClick, loading, messages, messagedElement])
  return (
    <>
      {config?.threadResumable && !isCurrentThread ? (
        <AutoResumeThread id={id!} />
      ) : null}
      {config?.threadResumable ? (
        isCurrentThread ? (
          <>{memoizedChat}</>
        ) : <div className='flex flex-grow justify-center items-center'><MdCircularProgress indeterminate/>
            <AutoResumeThread id={id!} />
        </div>
        ) : null}
      {config && !config.threadResumable ? (
        isCurrentThread ? (
          <>{memoizedChat}</>
        ) : (
          <p> گپ مورد نظر شما به مشکلی خورده است لطفا باری دیگر تلاش کنید </p>
        )
      ) : null}
    </>
  )
}

export default Messaging