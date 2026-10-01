import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useChatInteract,
  useChatSession,
  useConfig
} from '@chainlit/react-client';
import { toast } from 'react-toastify';

interface Props {
  id: string;
}

export default function AutoResumeThread({ id }: Props) {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { clear, setIdToResume } = useChatInteract();
  const { session, idToResume } = useChatSession();

  useEffect(() => {
    if (!config?.threadResumable) return;
    clear();
    setIdToResume(id);
    if (!config?.dataPersistence) {
      navigate('/');
    }
  }, [config?.threadResumable, id]);

  useEffect(() => {
    if (id !== idToResume) {
      return;
    }
    if (session?.error) {
      toast.error("در برقراری ارتباط با چت مورد نظر مشکلی به‌وجود آمده است.", {
        rtl: true,
        position: 'bottom-right'
      });
      navigate('/');
    }
  }, [session, idToResume, id]);

  return null;
}