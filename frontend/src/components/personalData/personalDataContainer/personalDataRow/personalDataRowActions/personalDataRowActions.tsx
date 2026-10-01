import { useOutsideClick } from '@/hooks/use_outside_click';
import { MdIcon, MdTextButton } from '@/material';
import React, { memo } from 'react'

interface IpersonalDataRowActionsProps {
  id: string,
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onClose: (id: string) => void
} 

const personalDataRowActionsComponent: React.FC<IpersonalDataRowActionsProps> = ({
  id,
  onDelete,
  onDownload,
  onClose
}) => {

  const ref = useOutsideClick(() => {
      onClose('')
  });
  
  return (
    <div ref={ref} className='w-32 absolute left-14 -translate-y-[50%] shadow bg-surface_variant rounded-lg flex flex-col justify-start items-start'>
      <button
        className='w-full px-2 py-1 flex flex-row justify-start items-center gap-1 text-sm vazir-light hover:bg-surface_container_high text-onsurface hover:text-error'
        onClick={() => onDelete(id)}>
          <MdIcon className='material-icons text-base'>delete</MdIcon>
          <p>حذف</p>
        </button>
      <button
        className='w-full px-2 py-1 flex flex-row justify-start items-center gap-1 text-sm vazir-light hover:bg-surface_container_high text-onsurface hover:text-primary'
        onClick={() => onDownload(id)}>
          <MdIcon className='material-icons text-base'>download</MdIcon>
          <p>بارگیری</p>
        </button>
    </div>
  )
}

export const PersonalDataRowActions = memo(personalDataRowActionsComponent)