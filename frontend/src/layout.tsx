import { useEffect } from 'react'
import Sidebar from './components/layout/sidebar';
import { Navbar } from './components/layout/navbar';
import { ChainlitAPI, sessionState, useChatData, useChatMessages, useChatSession } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import usePages from './context/pageContext';
import useSettings from './context/settingsContext';
import { useDidMountEffect } from './hooks/use_did_mount_effect';
import { MdLinearProgress } from './material';
import { Outlet } from 'react-router-dom';
import { API_ROUTE } from './constants/api';
import { useCookies } from 'react-cookie';
import { toast } from 'react-toastify';

const userEnv = {};

const CHAINLIT_SERVER = `${API_ROUTE}/chainlit`;
const apiClient = new ChainlitAPI(CHAINLIT_SERVER, "webapp");

export const Layout = () => {
  const { connect } = useChatSession();
  const session = useRecoilValue(sessionState);
  const { setActivePage } = usePages()
  const { currentTheme } = useSettings()
  const navigate = useNavigate()
  const { messages } = useChatMessages()
  const { connected } = useChatData();
  const [cookies] = useCookies();

  useDidMountEffect(() => {
    let localedMessages;

    if (localStorage.getItem('historiedMassages') && messages.length <= 0) {
      localedMessages = JSON.parse(localStorage.getItem('historiedMessages') ?? '');
    }
    else if (localStorage.getItem('historiedMessages') && messages.length > 0) {
      localedMessages = [...JSON.parse(localStorage.getItem('historiedMessages') ?? ''), messages[messages.length - 1]].filter((message) => message.type === 'user_message');
    }
    else {
      localedMessages = messages.filter((message) => message.type === 'user_message');
    }

    localStorage.setItem('historiedMessages', JSON.stringify(localedMessages.slice(-5, localedMessages.length))) // can modify the max number of saved massage in LocalStorage 
  }, [messages.length])

  useEffect(() => {
    setActivePage(location.pathname.split('/')[1])
  }, [navigate, location.pathname])

  useEffect(() => {
    if (session?.socket.connected) {
      return;
    }
    fetch(`${API_ROUTE}/auth/chainlit`, {
      credentials: "include", headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${cookies.danayar_access_token}`
      }
    })
      .then((res) => {
        res.status === 401 && navigate('./auth')
        return res.json();
      })
      .then(() => {
        connect({
          userEnv,
        });
      }).catch((err) => {
        toast.error(err, {
          position: 'bottom-right'
        })

      })

  }, [connect, cookies.danayar_access_token]);

  return (
    <div className={`layout ${cookies.theme ?? currentTheme} w-screen h-screen bg-surface_variant overflow-hidden relative flex justify-center items-center`}>
      <div className='w-full h-full bg-surface_variant relative flex flex-col justify-start items-center'>
        <Navbar />
        <div className='w-full flex-row h-full max-h-[93vh] bg-surface_variant rounded-2xl md:pb-4 md:pl-4 relative flex  justify-start items-center'>
          <div className='overflow-y-auto bg-surface_bright md:rounded-2xl w-full h-full relative'>
            {!connected && <MdLinearProgress indeterminate className='absolute top-0 w-full' />}
            <Outlet />
          </div>
          <Sidebar apiClient={apiClient} />
        </div>
      </div>
    </div>
  )
}
