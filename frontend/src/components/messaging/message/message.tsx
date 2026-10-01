import { IStep, useChatData } from '@chainlit/react-client';
import { MdFilledButton as MmdFilledButton, MdIcon } from '@/material';
import { memo, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { AudioFile } from '../../common/audio/audioFile';
import useMessaging from '@/context/messagingContext';
import { messagedElement } from '@/types';
import { Tooltip } from 'react-tooltip';
import { tooltip_style_setting } from '@/constants';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';

type IMessage = {
  message: IStep;
  loading: boolean;
  handleDashboardClick: (element: messagedElement) => void;
};

const MessageComponent: React.FC<IMessage> = ({ handleDashboardClick, message, loading }) => {
  const [element, setElement] = useState<ReactNode>(null);
  const [elementType, setElementType] = useState<'image' | 'audio' | 'text' | 'plotly' | 'document' | 'documents' | 'table'>('text');
  const { elements } = useChatData();
  const { setMessagedElement } = useMessaging();

  const handleElementRender = useCallback(async (element: messagedElement) => {
    switch (element.type) {
      case 'image':
        setElementType('image');
        setElement(<img src={element.src as string ?? (elements.find((item) => item.id === element.id)?.url?.toString())} alt={element.type} className='w-full h-auto object-cover rounded-lg' />);
        break;
      case 'audio':
        setElementType('audio');
        setElement(<AudioFile url={(elements.find((item) => item.id === element.id)?.url?.toString())} />);
        break;
      case 'plotly':
      case 'document':
      case 'documents':
      case 'table':
        setElementType(element.type);
        setMessagedElement(element);
        setElement(
          <div className='w-full h-full flex justify-start bg-surface_bright -mt-5'>
            <MmdFilledButton onClick={() => handleDashboardClick(element)}>نمایش جزییات</MmdFilledButton>
          </div>
        );
        break;
      default:
        setElementType('text');
        setElement(<p className='p-4'>مشکلی پیش‌آمده است لطفا باری دیگر تلاش کنید</p>);
        break;
    }
  }, [elements, handleDashboardClick, setMessagedElement]);

  useEffect(() => {
    if (message.output[0] === '{') {
      handleElementRender(JSON.parse(message.output));
    }
  }, [elements, message.output]);

  const memoizedElement = useMemo(() => element, [element]);
  const memoizedElementType = useMemo(() => elementType, [elementType]);

  return (
    <div dir='rtl' className={`flex ${message.type === 'user_message' ? 'flex-row self-end' : 'flex-row-reverse self-start'} justify-start items-start gap-4 p-3 w-full`}>
      {(memoizedElementType === 'text' || memoizedElementType === 'audio') ? (
        <div className={`flex justify-center items-center p-1 ${message.type === 'user_message' ? 'bg-secondary text-onsecondary' : 'bg-primary text-onprimary'} rounded-full`}>
          <MdIcon data-tooltip-id={message.id} data-tooltip-content={message.name} className="material-icons">person</MdIcon>
          <Tooltip id={message.id} style={tooltip_style_setting} />
        </div>
      ) : (
        <div className='w-10' />
      )}
      <div className={`md:w-full w-[90%] prose dark:prose-invert prose-h1:font-semibold prose-h1:text-xl prose-p:text-black prose-a:text-primary prose-p:text-justify prose-img:rounded-xl prose-headings:underline prose-pre:bg-transparent prose-pre:p-0 prose-table:bg-white prose-table:p-1 prose-table:rounded-lg prose-th:text-center prose-th:no-underline prose-th:font-bold prose-td:text-center prose-td:no-underline prose-thead:border-0 prose-tr:border-0 ${message.type === 'assistant_message' && 'bg-surface_variant rounded-2xl'} ${message.type === 'assistant_message' && message.output[0] !== '{' && 'px-4 py-3'}`}>
        {message.output[0] !== '{' ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            children={message.output}
            components={{
              code({ children, className, ...rest }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    customStyle={{ direction: 'ltr', borderRadius: '0.5rem' }}
                    dir="ltr"
                    PreTag="div"
                    children={String(children).replace(/\n$/, '')}
                    language={match[1]}
                    style={darcula}
                  />
                ) : (
                  <code dir="ltr" {...rest} className={className}>
                    {children}
                  </code>
                );
              }
            }}
          />
        ) : (
          memoizedElement
        )}
        {message.type === 'assistant_message' && loading && (
          <div className='bg-secondary w-3 h-3 rounded-full inline-block mx-1 -mb-0.5 animate-ping' />
        )}
      </div>
    </div>
  );
};

export const Message = memo(MessageComponent);