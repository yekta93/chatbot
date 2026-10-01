import ReactDOMServer from "react-dom/server";
import { Link, useNavigate } from "react-router-dom"
import useSettings from "@/context/settingsContext"
import usePages from "@/context/pageContext"
import { ChainlitAPI, currentThreadIdState, IPagination, IThread, IThreadFilters, useChatInteract, useChatMessages } from "@chainlit/react-client"
import useGroupData from "@/context/groupDataContext"
import { isMobile } from "react-device-detect"
import { Fab } from "../common/buttons/fab"
import { IconButton } from "../common/buttons/iconButton"
import React, { useCallback, useEffect, useState } from "react"
import { Tooltip } from "react-tooltip"
import { tooltip_style_setting } from "@/constants"
import { useRecoilValue } from "recoil";

interface ISidebarProps {
  apiClient: ChainlitAPI
}

const Sidebar: React.FC<ISidebarProps> = ({
  apiClient
}) => {
  const [threads, setThreads] = useState<IThread[]>([]);
  const { menuOpen, setMenuOpen, activePage } = usePages()
  const { settingOpen, setSettingOpen } = useSettings()
  const { previewedDocument } = useGroupData()
  const { messages, threadId } = useChatMessages()
  const currentThreadId = useRecoilValue(currentThreadIdState)
  const { clear, setIdToResume } = useChatInteract()
  const navigate = useNavigate()

  // TODO: fix the history managment of chainlit
  const handleChat = () => {
    if (activePage === 'thread' || activePage === '') {
      clear()
      navigate('/')
    }
    else {
      if (messages.length > 0) {
        navigate(`/thread/${currentThreadId}`)
      } else {
        clear()
        navigate('/')
      }
    }
  }

  const fetchThreads = async () => {
    try {
      const pagination: IPagination = { first: 35 };
      const filter: IThreadFilters = { /* your filter data */ };
      const response = await apiClient.listThreads(pagination, filter);
      setThreads(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetThread = useCallback(
    async (thread: IThread) => {
      await clear()
      await setIdToResume(thread.id)
      navigate(`/thread/${thread.id}`)
    }, [clear, navigate, setIdToResume])

  useEffect(() => {
    fetchThreads();
  }, [messages.length]);


  return (
    <nav
      className={`${menuOpen ? 'md:w-96 w-64 md:shadow-none shadow-md' : 'w-20 md:opacity-100 opacity-0 md:pointer-events-auto pointer-events-none'} md:relative absolute right-0 items-end transition-all duration-300 ease-in-out h-full bg-surface_variant flex flex-col justify-evenly gap-2 py-2`}>

      {/* top side of sidebar(the fabs and history) */}
      <div className='flex flex-col w-full justify-start items-end gap-4 px-3 h-2/3  '>
        <Fab
          handleClick={handleChat}
          variant="primary"
          icon={activePage === 'thread' || activePage === '' ? "add" : "chat_bubble"}
          title={activePage === 'thread' || activePage === '' ? "گپ جدید" : "گپ"}
          isExpanded={menuOpen}
        />
        <Fab
          disabled={true}
          handleClick={() => navigate('/discover')}
          variant="secondary"
          icon="explore"
          title="کاوش"
          isExpanded={menuOpen}
        />
        <div id="navigation_bar" className="relative w-full h-full">
          
          <p dir="rtl" className={`${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} whitespace-nowrap text-xs text-onsurface_variant px-2 py-3`}>تاریخچه گپ :</p>
          <div dir="rtl" className={`${menuOpen ? 'opacity-100 h-full' : 'opacity-0 h-0 pointer-events-none'} max-h-[35vh] overflow-auto flex flex-col gap-1 relative max-w-[18rem] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out`}>
            {
              threads.map((thread, index) => (
                <div onClick={() => handleSetThread(thread)} key={index} className={`w-full cursor-pointer ${thread.id === threadId ? 'text-primary bg-surface_bright' : 'text-onsurface hover:bg-surface_dim'} p-2 rounded-lg flex flex-col justify-center items-start`}>
                  <p
                    data-tooltip-id={`thread_${index}`}
                    data-tooltip-content={thread.name}
                    data-tooltip-html={ReactDOMServer.renderToStaticMarkup(
                      <div>
                        <p className="text-wrap whitespace-normal break-words max-w-[16rem]">
                          {thread.name}
                        </p>
                      </div>
                    )}
                    className={`text-s text-right w-4/5 text-nowrap text-ellipsis overflow-hidden`}
                  >
                      {thread.name}
                  </p>
                  <Tooltip id={`thread_${index}`} style={tooltip_style_setting}/>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* the bottom side of sidebar(the buttons and setting) */}
      <div className='flex flex-col w-full h-1/3 justify-end items-end md:gap-0 gap-2 px-3'>
        <Link
          onClick={() => isMobile && setMenuOpen(false)}
          to={previewedDocument.doc_id !== '' ? `/doc-preview/${previewedDocument.doc_id}` : `/${activePage}`}
          className={menuOpen ? 'min-w-full w-full' : 'min-w-[40px]'}>
          <IconButton
            disabled={previewedDocument.doc_id === ''}
            selected={activePage === 'doc-preview' && !settingOpen}
            variant={isMobile ? "secondary" : "primary"}
            icon="description"
            title='نمایش فایل‌' isExpanded={menuOpen}
          />
        </Link>
        <Link
          onClick={() => isMobile && setMenuOpen(false)}
          to='/organization-data'
          className={menuOpen ? 'min-w-full w-full' : ' min-w-[40px]'}>
          <IconButton
            disabled={false}
            selected={activePage === 'organization-data' && !settingOpen}
            variant={isMobile ? "secondary" : "primary"}
            icon="apartment"
            title='داده‌های سازمانی'
            isExpanded={menuOpen}
          />
        </Link>
        <Link
          onClick={() => isMobile && setMenuOpen(false)}
          to='/personal-data'
          className={menuOpen ? 'min-w-full w-full' : ' min-w-[40px]'}>
          <IconButton
            disabled={false}
            selected={activePage === 'personal-data' && !settingOpen}
            variant={isMobile ? "secondary" : "primary"}
            icon="folder_shared"
            title='داده‌های شخصی'
            isExpanded={menuOpen}
          />
        </Link>
        <div className={menuOpen ? 'min-w-full w-full' : ' min-w-[40px]'}>
          <IconButton
            disabled={true}
            selected={activePage === 'bookmark' && !settingOpen}
            variant={isMobile ? "secondary" : "primary"}
            icon="bookmark"
            title='ذخیره'
            isExpanded={menuOpen}
          />
        </div>
        <div className={menuOpen ? 'min-w-full w-full' : ' min-w-[40px]'}>
          <IconButton
            selected={settingOpen}
            handleClick={() => { setSettingOpen(!settingOpen); isMobile && setMenuOpen(false) }}
            variant={isMobile ? "secondary" : "primary"}
            disabled={false}
            icon="settings"
            title='تنظیمات'
            isExpanded={menuOpen}
          />
        </div>
      </div>
    </nav >
  )
}

export default Sidebar