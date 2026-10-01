import { fileDisplays } from '@/types/personalData'
import React, { memo } from 'react'

interface IpersonalDataDisplayProps {
  displays: fileDisplays,
}

const personalDataDisplayComponent: React.FC<IpersonalDataDisplayProps> = ({
  displays
}) => {
  return (
    <div className='w-full flex flex-row justify-start items-center gap-2 p-2'>
      {
        displays.filter((item) => item.type !== 'hidden').map((col, index) => (
          <p
            key={index}
            className='vazir-medium text-onsurface_variant'
            style={{width: `${col.width - 0.5}%`}}
          >
            {col.title}
          </p>
        ))
      }
      <span className='w-[10%]'/>
    </div>
  )
}

export const PersonalDataDisplay = memo(personalDataDisplayComponent)