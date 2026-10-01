import React, { memo } from 'react'
import { MdIcon, MdRipple } from '@/material'
import { organizationGroup } from '@/types/organizationData'

interface IPersonalFolderProps extends organizationGroup {
  description: string,
  handleClick: (organizationGroup: organizationGroup) => void
}

const personalFolderComponent: React.FC<IPersonalFolderProps> = ({ handleClick,
  description,
  title,
  resolve,
  id
}) => {
  return (
    <div onClick={() => handleClick({title, id, resolve})} className='md:w-48 w-36 h-48 md:h-60 text-ellipsis relative cursor-pointer bg-surface_variant text-sm text-onsurface_variant rounded-lg flex flex-col justify-evenly items-center pl-3 pr-4'>
      <MdRipple />
      <MdIcon className='material-icons h-fit w-fit flex justify-center items-center md:text-9xl text-7xl'>folder</MdIcon>
      <div className='w-full  flex justify-between items-center'>
        <h3 className='text-ellipsis md:text-base text-onsurface whitespace-nowrap overflow-hidden text-base w-full'>
          {title}
        </h3 >
        {/* <MenuPopover
          scrollLock={false}
          cn='-translate-x-[100%] absolute'
          items={[
            { title: 'تغییر نام', icon: 'edit' },
            { title: 'بارگیری', icon: 'download' },
            { title: 'بارگذاری', icon: 'upload' },
            { title: 'حذف', icon: 'delete' },
          ]} /> */}
      </div>
      <div className='w-full  flex justify-start items-center'>
        <p className='w-4/5 text-onsurface_variant md:text-sm text-xs'>{description}</p>
      </div>
    </div>
  )
}

export const PersonalFolder = memo(personalFolderComponent)