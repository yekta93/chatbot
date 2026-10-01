import HistoriedMessages from '@/components/common/historiedMassages/historiedMessages';
import { Input } from '@/components/common/input/input';
import { tooltip_style_setting } from '@/constants';
import useMessaging from '@/context/messagingContext';
import { MdIcon, MdIconButton } from '@/material';
import { IStep, useChatData, useChatInteract } from '@chainlit/react-client';
import autosize from 'autosize';
import React, { useState, useRef, useEffect, useCallback, KeyboardEvent, useMemo, memo } from 'react';
import { Tooltip } from 'react-tooltip';

const LandingInputContainerComponent: React.FC = () => {
  const { sendMessage, stopTask } = useChatInteract();
  const [historiedMessageOpen, setHistoriedMessageOpen] = useState<boolean>(false);
  const [selectedHistoriedMessage, setSelectedHistoriedMessage] = useState<number>(0);
  const { loading, connected } = useChatData();
  const { setThreadedMessages, threadedMessages } = useMessaging();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const historiedMessages = useMemo(() => JSON.parse(localStorage.getItem('historiedMessages') ?? '[]'), [])

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      autosize(textarea);
    }

    return () => {
      if (textarea) {
        autosize.destroy(textarea)
      }
    }
  }, [threadedMessages]);

  const handleHistoriedMessageReset = useCallback(() => {
    setSelectedHistoriedMessage(0);
    setHistoriedMessageOpen(false);
  }, [])

  const handleSendMessage = useCallback(() => {
    if (threadedMessages.trim()) {
      const message = {
        name: "user",
        type: "user_message" as const,
        output: threadedMessages,
      };
      sendMessage(message, []);
      setThreadedMessages("");
      handleHistoriedMessageReset();
    }
  }, [handleHistoriedMessageReset, sendMessage, setThreadedMessages, threadedMessages])

  const handleHistoriedMessageMove = useCallback((pressedKey: string) => {
    const isArrowUp = pressedKey === 'ArrowUp';
    const isArrowDown = pressedKey === 'ArrowDown';
    if (isArrowUp) {
      setHistoriedMessageOpen(true);
    }

    setSelectedHistoriedMessage(prev => {
      const newIndex = isArrowUp
        ? (prev % historiedMessages.length) + 1
        : prev - 1;

      if (isArrowDown && newIndex <= 1) {
        handleHistoriedMessageReset();
      }

      return newIndex;
    });

  }, [historiedMessages.length, handleHistoriedMessageReset]);

  const handleAutoSize = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      autosize(textarea);
      textarea.focus();
    }
  }, []);

  const handleHistoriedMessageSelect = useCallback((message?: IStep) => {
    const newValue = message
      ? message.output
      : historiedMessages[selectedHistoriedMessage < 0
        ? Math.abs(selectedHistoriedMessage)
        : historiedMessages.length - selectedHistoriedMessage
      ].output;

    setThreadedMessages(newValue)
  }, [historiedMessages, selectedHistoriedMessage]);

  const handleOnKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const { key } = event;

      if (key === 'ArrowUp' || key === 'ArrowDown') {
        handleHistoriedMessageMove(key);
        return;
      }

      if (['Tab', 'Enter'].includes(key) && !event.shiftKey && threadedMessages === '' && historiedMessageOpen) {
        event.preventDefault();
        handleHistoriedMessageSelect();
        return;
      }

      if (key === 'Escape' && historiedMessageOpen) {
        event.preventDefault();
        setHistoriedMessageOpen(false);
        return;
      }

      if (key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!loading) {
          handleSendMessage();
        }
      }
    },
    [threadedMessages, historiedMessageOpen, handleHistoriedMessageMove, handleHistoriedMessageSelect, loading, handleSendMessage]);

  const handleSendClick = useCallback(() => {
    if (!loading)
      handleSendMessage()
    else
      stopTask()
  }, [handleSendMessage, loading])

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setThreadedMessages(value)
  }, [])

  useEffect(() => {
    handleAutoSize();
  }, [loading, connected, handleAutoSize]);

  const memoizedSendButtonContent = useMemo(() => !loading ? 'ارسال پیام' : 'توقف پیام', [loading])
  const memoizedSendButtonIcon = useMemo(() => !loading ? 'send' : 'stop', [loading])

  return (
    <>
      <MdIconButton data-tooltip-id='attach_file_action' data-tooltip-content='بارگذاری فایل'>
        <MdIcon className="material-icons">attach_file</MdIcon>
      </MdIconButton>
      <Tooltip id='attach_file_action' style={tooltip_style_setting} />
      <div className="relative w-full h-fit py-1 px-4 rounded-[2rem] flex flex-row justify-center items-center gap-2 bg-surface_variant">
        <MdIconButton
          data-tooltip-id='mic_stop_action'
          data-tooltip-content={memoizedSendButtonContent}
          onClick={handleSendClick}>
          <MdIcon className="material-icons vertical-flip">{memoizedSendButtonIcon}</MdIcon>
        </MdIconButton>
        <Tooltip id='mic_stop_action' style={tooltip_style_setting} />

        {/* TODO: make the component below cleaner and try to make the rerenders less */}
        <HistoriedMessages
          inputValue={threadedMessages}
          historiedMessageOpen={historiedMessageOpen}
          handleHistoriedMessageReset={handleHistoriedMessageReset}
          historiedMessages={historiedMessages}
          selectedHistoriedMessage={selectedHistoriedMessage}
          handleOutsideClick={() => {
            if (historiedMessageOpen) {
              setHistoriedMessageOpen(false);
              setSelectedHistoriedMessage(0);
            }
          }}
          handleSelectMessage={(message) => handleHistoriedMessageSelect(message)}
        />

        <Input
          ref={textareaRef}
          autoFocus
          disabled={!connected || loading}
          className="flex-1"
          id="message-input"
          value={threadedMessages}
          onChange={handleInputChange}
          onKeyDown={handleOnKeyDown}
          placeholder="هر سوالی داری از من بپرس"
        />
      </div>
    </>
  );
};

export const LandingInputContainer = memo(LandingInputContainerComponent);