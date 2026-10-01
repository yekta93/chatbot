import SettingDetails from '@/components/setting/settingDetails/settingDetails'
import SettingNavigation from '@/components/setting/settingNavigation/settingNavigation'
import useSettings from '@/context/settingsContext'
import { useOutsideClick } from '@/hooks/use_outside_click'
import { useCookies } from 'react-cookie'

const Settings = () => {
  const { currentTheme, settingOpen, setSettingOpen } = useSettings()
  const [cookies] = useCookies();

  const ref = useOutsideClick(() => {
    if (settingOpen)
      setSettingOpen(settingOpen ? false : settingOpen)
  });

  return (
    <div dir='rtl' className={`layout ${cookies.theme ?? currentTheme} fixed ${settingOpen ? 'bg-black bg-opacity-50 w-full h-full' : 'bg-black bg-opacity-0 opacity-0 w-full h-full pointer-events-none'} transition-all duration-200 inset-0 flex justify-center items-center z-50`}>
      <div ref={ref} className='bg-surface_bright rounded-lg flex flex-row gap-4 justify-between items-center lg:w-[50vw] md:w-[95vw] w-[100vw] lg:h-[60vh] md:h-[70vh] h-[100vh] text-sm'>
        <SettingNavigation settingOpen={settingOpen} />
        <SettingDetails />
      </div>
    </div>
  )
}

export default Settings