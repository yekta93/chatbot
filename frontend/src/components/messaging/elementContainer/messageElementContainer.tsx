import { Dashboard } from './messageElement'
import { MdIcon } from '@/material'
import { messagedElement } from '@/types';
import React, { memo } from 'react';

interface IDashboardContainerProps {
  isExpanded: boolean;
  messagedElement: messagedElement;
  setIsExpanded: (isExpanded: boolean) => void;
}

const DashboardContainerComponent: React.FC<IDashboardContainerProps> = ({
  isExpanded,
  messagedElement,
  setIsExpanded,
}) => {

  return (
    <>
      <div className={`${isExpanded ? 'w-full' : 'w-0'} lg:relative absolute left-0 z-10 transition-all duration-200 ease-in-out overflow-x-hidden h-full`}>
          {
            messagedElement &&
              <div className='w-full h-full flex justify-center items-center pr-4 gap-4'>
                  <Dashboard dashboard={messagedElement} />
              </div>
          }
      </div>
      <button onClick={() => setIsExpanded(!isExpanded)} className={` ${isExpanded ? 'h-32' : 'h-0'}  w-[1px] bg-surface_dim lg:flex hidden justify-center items-center transition-all duration-200 ease-in-out z-20`}>
        <div className='bg-surface_dim p-1 rounded-full flex justify-center items-center'>
          <MdIcon className='material-icons'>{isExpanded ? 'chevron_left' : 'chevron_right'}</MdIcon>
        </div>
      </button>
      <button onClick={() => setIsExpanded(!isExpanded)} className={`absolute flex lg:hidden justify-center items-center transition-all duration-200 ease-in-out z-20`}>
        <div className='bg-surface_dim p-1 rounded-full flex justify-center items-center'>
          <MdIcon className='material-icons'>{isExpanded ? 'chevron_left' : 'chevron_right'}</MdIcon>
        </div>
      </button>
    </>
  )
}

export const DashboardContainer = memo(DashboardContainerComponent)