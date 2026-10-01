import HistoriedMessages from '@/components/common/historiedMassages/historiedMessages';
import { Input } from '@/components/common/input/input';
import { tooltip_style_setting } from '@/constants';
import { MdIcon, MdIconButton } from '@/material';
import { IStep, useChatData, useChatInteract } from '@chainlit/react-client';
import autosize from 'autosize';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'react-tooltip';

const historiedMessages = () => JSON.parse(localStorage.getItem('historiedMessages') ?? '[]')

const MessageInputContainer = () => {
    const [inputValue, setInputValue] = useState("");
    const [historiedMessageOpen, setHistoriedMessageOpen] = useState<boolean>(false);
    const [selectedHistoriedMessage, setSelectedHistoriedMessage] = useState<number>(0);
    const { sendMessage, stopTask } = useChatInteract();
    const { loading, connected } = useChatData();
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        textareaRef.current?.focus();
        if (textareaRef.current) {
            inputValue === '' ? textareaRef.current.style.height = '100%' : autosize(textareaRef.current);
        }
    }, [inputValue])

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
            handleHistoriedMessageReset()
            handleAutoSize()
        }
    };

    const handleHistoriedMessageReset = () => {
        setSelectedHistoriedMessage(0)
        setHistoriedMessageOpen(false)
    }

    const handleHistoriedMessageMove = (pressedKey: string) => {
        setHistoriedMessageOpen(pressedKey === 'ArrowUp' ? true : historiedMessageOpen)
        setSelectedHistoriedMessage(pressedKey === 'ArrowUp' ? (selectedHistoriedMessage % historiedMessages().length + 1) : (selectedHistoriedMessage - 1))
        if (selectedHistoriedMessage <= 1 && pressedKey === 'ArrowDown')
            handleHistoriedMessageReset()
    }

    const handleAutoSize = () => {
        if (textareaRef.current) {
            autosize(textareaRef.current)
            const str = textareaRef.current.value;
            let enterCount = 0;

            for (let i = 0; i < str.length; i++) {
                if (str[i] === '\n' || str[i] === '\r') {
                    enterCount += 1
                }
            }
            textareaRef.current.style.height = (enterCount * 6) + 6 + `vh`
            textareaRef.current.focus()
        }
    }

    const handleHistoriedMessageSelect = async (message?: IStep) => {
        if (message)
            setInputValue(message.output)
        else
            await setInputValue(historiedMessages()[selectedHistoriedMessage < 0 ? Math.abs(selectedHistoriedMessage) : historiedMessages().length - selectedHistoriedMessage].output)
        handleAutoSize()
    }

    useEffect(() => {
        handleAutoSize()
    }, [loading, connected])


    return (
        <>
            <MdIconButton data-tooltip-id='attach_file_action' data-tooltip-content='بارگذاری فایل'>
                <MdIcon className="material-icons">attach_file</MdIcon>
            </MdIconButton>
            <Tooltip id='attach_file_action' style={tooltip_style_setting} />
            <div className="relative w-full h-fit py-1 px-4 rounded-[2rem] flex flex-row gap-2 bg-surface_variant">
                <MdIconButton data-tooltip-id='mic_stop_action' data-tooltip-content={inputValue !== '' ? 'ارسال پیام' : loading ? 'توقف پیام' : 'ضبط صدا'} onClick={() => inputValue !== '' ? handleSendMessage() : loading ? stopTask() : () => { }}>
                    <MdIcon className="material-icons vertical-flip">{inputValue !== '' ? 'send' : loading ? 'stop' : 'mic'}</MdIcon>
                </MdIconButton>
                <Tooltip id='mic_stop_action' style={tooltip_style_setting} />
                <HistoriedMessages
                    inputValue={inputValue}
                    historiedMessageOpen={historiedMessageOpen}
                    handleHistoriedMessageReset={handleHistoriedMessageReset}
                    historiedMessages={historiedMessages}
                    selectedHistoriedMessage={selectedHistoriedMessage}
                    handleOutsideClick={() => {
                        if (historiedMessageOpen)
                            setHistoriedMessageOpen(historiedMessageOpen ? false : historiedMessageOpen)
                        setSelectedHistoriedMessage(0)
                    }}
                    handleSelectMessage={(message) => {
                        handleHistoriedMessageSelect(message)
                    }}
                />
                <Input
                    ref={textareaRef}
                    autoFocus
                    disabled={!connected || loading}
                    className="flex-1"
                    id="message-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                            handleHistoriedMessageMove(e.key)
                        }
                        else if ((e.key === "Tab" || e.key === "Enter") && !e.shiftKey && inputValue === '' && historiedMessageOpen) {
                            e.preventDefault()
                            handleHistoriedMessageSelect()
                        }
                        else if (e.key === "Escape" && historiedMessageOpen) {
                            e.preventDefault()
                            setHistoriedMessageOpen(false)
                        }
                        else if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            !loading && handleSendMessage();
                        }
                    }}
                    placeholder="هر سوالی داری از من بپرس" />
            </div>
        </>
    )
}

export default MessageInputContainer