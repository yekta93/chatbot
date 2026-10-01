import useGroupData from '@/context/groupDataContext';
import { useChatInteract } from '@chainlit/react-client';
import { useEffect } from 'react'
import { useParams } from 'react-router-dom';
import DocMessagingChatContainer from '@/components/docMessaging/docMessagingChat/docMessagingChatContainer';
import { DocMessagingObjects } from '@/components/docMessaging/docMessagingDetails/docMessagingObjects';

const ChatPreview = () => {
  const { id } = useParams();
  const { setDisplays, setPreviewDocument, previewedDocument } = useGroupData()
  const { clear } = useChatInteract();

  const handleDocFetch = async () => {
    if (id) {
      await setDisplays({
        group_id: '',
        doc_id: id,
        partial: false
      })
      await setPreviewDocument({
        doc_id: id,
        personal: false
      })
    }
  }

  useEffect(() => {
    id &&
      handleDocFetch()
    clear()
  }, [id])

  return (
    <section className="w-full h-full relative flex lg:flex-row flex-col justify-between items-center gap-4 p-4">
      <DocMessagingObjects previewedDocument={previewedDocument} />

      <div className='lg:w-1/3 w-full transition-all duration-300 ease-in-out h-full relative flex flex-col justify-between items-center'>
        <DocMessagingChatContainer />
      </div>
    </section >
  )
}

export default ChatPreview