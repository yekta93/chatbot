import { useChatData, useChatInteract, useChatMessages } from '@chainlit/react-client'
import { useNavigate } from 'react-router-dom'
import { useDidMountEffect } from '@/hooks/use_did_mount_effect'
import { useCallback } from 'react'
import { LandingStatistics } from '@/components/landing/landingStatistics/landingStatistics'
import { LandingInputContainer } from '@/components/landing/landingInputContainer/landingInputContianer'

const Landing = () => {
  const { messages, threadId } = useChatMessages();
  const { loading, connected } = useChatData();
  const { sendMessage } = useChatInteract();
  const navigate = useNavigate()

  const handleSendMessage = useCallback(
    (subtitle: string) => {
      if (subtitle.trim() && !loading && connected) {
        const message = {
          name: "user",
          type: "user_message" as const,
          output: subtitle,
        };
        sendMessage(message, []);
      }
  }, [connected, loading])

  useDidMountEffect(() => {
    if (messages.length && threadId){
      console.log('threadId', threadId)
      console.log('messages.length', messages.length)
      navigate(`/thread/${threadId}`)
    }
  }, [messages.length, threadId])

  return (
    <main className="w-full h-full relative flex flex-col justify-between items-center p-4">
      <div dir="rtl" className="h-full xl:w-1/2 w-full flex flex-col justify-center items-center gap-8 text-onsurface">
        <LandingStatistics 
          handleSendMessage={handleSendMessage}
        />
      </div>
      <div className="xl:w-1/2 w-full min-w-[40vw] h-fit rounded-full flex flex-row justify-center items-center gap-2 ">
        <LandingInputContainer />
      </div>
    </main >
  )
}

export default Landing