import useSettings from '@/context/settingsContext'
import { MdIcon, MdIconButton } from '@/material'
import { ThemeCard } from './themeCard/themeCard'
import { useCallback } from 'react'
import { themes } from '@/constants/settings'

const SettingDetails = () => {
    const { setSettingOpen, setCurrentTheme, currentTheme } = useSettings()

    const handleThemeChange = useCallback(
        (theme: string) => {
            setCurrentTheme(theme)
            localStorage.setItem('theme', theme)
        }, [])

    return (
        <div className='w-3/4 h-full flex flex-col justify-start items-start'>
            <div className='w-full flex justify-end items-center p-7 pb-3'>
                <MdIconButton onClick={() => setSettingOpen(false)}>
                    <MdIcon className='material-icons'>close</MdIcon>
                </MdIconButton>
            </div>
            <div className='w-full h-full flex flex-col overflow-y-auto justify-start items-start text-onsurface gap-4 pb-4'>
                <h4>رنگ‌بندی‌ها</h4>
                <div className='px-4 w-full h-full  flex flex-col gap-1 justify-start items-start'>
                    {themes.map((theme, index) => (
                        <ThemeCard
                            key={index}
                            theme={theme.name}
                            title={theme.title}
                            onClick={handleThemeChange}
                            isSelected={[currentTheme, localStorage.getItem('theme')].some((item) => item === theme.name)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SettingDetails