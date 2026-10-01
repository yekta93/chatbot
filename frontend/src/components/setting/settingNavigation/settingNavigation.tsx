import { IconButton } from '@/components/common/buttons/iconButton'
import { useState } from 'react'

const SettingNavigation = ({settingOpen}: {settingOpen:boolean}) => {
  const [settingTab, setSettingTab] = useState<string>('build')

    return (
        <div className='md:w-1/4 w-1/3 h-full border-l border-surface_variant flex flex-col justify-start items-start gap-0'>
            <h3 className='text-onsurface text-lg p-8 pb-4'>تنظیمات</h3>
            <div className='flex flex-col justify-start items-start w-full h-full gap-1 md:px-4'>
                <IconButton
                    disabled={false}
                    selected={settingTab === 'build'}
                    variant='secondary'
                    icon="build"
                    isExpanded={settingOpen}
                    title='عمومی'
                    handleClick={() => setSettingTab('build')}
                />
                {/* <IconButton selected={settingTab === 'person'} variant='secondary' icon={<MdIcon className='material-icons scale-75' slot='icon'>person</MdIcon>} isExpanded={settingOpen} title='حساب کاربری' handleClick={() => setSettingTab('person')} /> */}
                {/* <IconButton selected={settingTab === 'mic'} variant='secondary' icon={<MdIcon className='material-icons scale-75' slot='icon'>mic</MdIcon>} isExpanded={settingOpen} title='صدا' handleClick={() => setSettingTab('mic')} /> */}
            </div>
        </div>
    )
}

export default SettingNavigation