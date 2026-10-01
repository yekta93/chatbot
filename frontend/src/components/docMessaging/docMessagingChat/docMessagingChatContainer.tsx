import { Input } from '@/components/common/input/input';
import { MessageContainer } from '@/components/messaging/messageContainer/messageContainer';
import { tooltip_style_setting } from '@/constants';
import useGroupData from '@/context/groupDataContext';
import { MdIcon, MdIconButton } from '@/material';
import { useChatData, useChatInteract, useChatMessages } from '@chainlit/react-client';
import { useState } from 'react'
import { Tooltip } from 'react-tooltip';

const DocMessagingChatContainer = () => {
    const { loading, connected } = useChatData();
    const { messages } = useChatMessages();
    const [inputValue, setInputValue] = useState("");
    const { sendMessage, stopTask} = useChatInteract();
    const { previewedDocument } = useGroupData()

    const handleSendMessage = () => {
        const content = inputValue.trim()
    
        if (content) {
          const message = {
            name: "user",
            type: "user_message" as const,
            output: content,
          };
          sendMessage(message, []);
          setInputValue("");
        }
      };

  return (
    <>
            <div dir='rtl' className='w-full flex flex-row justify-start items-center gap-2 border-b border-surface_variant py-2'>
          <MdIcon className='material-icons text-primary'>description</MdIcon>
          <h4 className='vazir-bold text-lg'>{previewedDocument.name}</h4>
        </div>
        <MessageContainer handleDashboardClick={() => { }} loading={loading} messages={messages} />
        <div className="w-full min-w-[25vw] h-fit rounded-[5rem] flex flex-row justify-center items-center gap-2">
          <MdIconButton>
            <MdIcon className="material-icons">attach_file</MdIcon>
          </MdIconButton>
          <div className="w-full h-fit py-1 px-4 rounded-[2rem] flex flex-row gap-2 bg-surface_variant">
              <MdIconButton data-tooltip-id='mic_stop_action' data-tooltip-content={inputValue !== '' ? 'ارسال پیام' : loading ? 'توقف پیام' : 'ضبط صدا'} onClick={() => inputValue !== '' ? handleSendMessage() : loading ? stopTask() : () => {}}>
                <MdIcon className="material-icons vertical-flip">{inputValue !== '' ? 'send' : loading ? 'stop' : 'mic'}</MdIcon>
              </MdIconButton>
              <Tooltip id='mic_stop_action' style={tooltip_style_setting}/>
            <Input
              autoFocus
              disabled={!connected || loading}
              className="flex-1"
              id="message-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  !loading && handleSendMessage();
                }
              }}
              placeholder="هر سوالی داری از من بپرس" />
          </div>
        </div>
    </>
    )
}

export default DocMessagingChatContainer