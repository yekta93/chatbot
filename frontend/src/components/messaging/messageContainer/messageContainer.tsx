import { IStep } from '@chainlit/react-client'
import { memo, useEffect, useMemo, useRef } from 'react'
import { Message } from '../message/message';
import { messagedElement } from '@/types';
import { flattenMessages } from '@/lib/utils';

type IMessageContainer = {
  messages: IStep[];
  loading: boolean;
  handleDashboardClick: (element: messagedElement) => void;
}

const MessageContainerComponents = ({ handleDashboardClick, messages, loading }: IMessageContainer) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const flatMessages = useMemo(() => {
    return flattenMessages(messages, (m) => m.type.includes("message"))
  }, [messages])

  const userMessageLengthMemoized = useMemo(() => flatMessages.filter((message) => message.type === 'user_message').length ,[flatMessages])

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scroll({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [userMessageLengthMemoized]);

  return (
    <div ref={messagesContainerRef} className='w-full h-full flex justify-center overflow-x-hidden overflow-y-auto scroll-p-20'>
      <div className="xl:w-1/2 w-full min-w-[25vw] h-full flex flex-col gap-2 py-4">
        {flatMessages.map((message) =>
          <Message
            key={message.id}
            handleDashboardClick={handleDashboardClick}
            loading={loading && flatMessages.at(-1)?.id === message.id}
            message={message} />
        )}
      </div>
    </div>
  )
}

export const MessageContainer = memo(MessageContainerComponents)