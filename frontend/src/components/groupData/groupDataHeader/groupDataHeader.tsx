import { MdIcon } from '@/material'
import { previousGroup } from '@/types/organizationData';
import React, { memo } from 'react';

interface IGroupDataHeaderProps {
  previousGroups: previousGroup[],
  handleBack: (prev: previousGroup) => void
}

const groupDataHeaderComponent: React.FC<IGroupDataHeaderProps> = ({
  previousGroups,
  handleBack
}) => {
  return (
    <div className='flex w-full md:flex-row flex-col md:justify-between justify-start md:items-center items-start md:gap-0 gap-4'>
      <div className='flex w-full flex-wrap justify-start items-end gap-1 text-onsurface_variant'>
        {previousGroups.map((previousGroup, index) =>
          <div className='flex items-center cursor-pointer' key={index}>
            {
              index > 0 &&
              <MdIcon className='material-icons'>chevron_left</MdIcon>
            }
            <p onClick={() => handleBack(previousGroup)}
              className={`${index <= 0 && 'md:text-2xl text-lg vazir-bold text-onsurface'}
                ${previousGroups.length > 1 && 'hover:text-primary'}`}>
              {previousGroup.title}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export const GroupDataHeader = memo(groupDataHeaderComponent)