import useUsers from '@/context/usersContext';
import { useOutsideClick } from '@/hooks/use_outside_click';
import { MdIcon } from '@/material';
import React, { memo, useEffect } from 'react'

interface IuserMenuContainerProps {
  outsideClick: () => void
  isOpen: boolean
}

const UserMenuContainerComponent: React.FC<IuserMenuContainerProps> = ({ isOpen, outsideClick }) => {
  const { fname, lname, phoneNum, getUser, removeUser } = useUsers();

  useEffect(() => {
    if (!phoneNum) {
      getUser()
    }
  }, [isOpen])


  const ref = useOutsideClick(() => {
    if (isOpen)
      outsideClick()
  });

  return (
    <div ref={ref} dir="rtl" className={`w-44 ${isOpen ? 'max-h-96 p-2' : 'max-h-0 p-0'} transition-all duration-300 ease-in-out overflow-y-auto bg-surface_variant shadow-sm overflow-hidden rounded-lg fixed top-16 left-6 flex flex-col justify-start items-start gap-3`}>
      <p className='text-onsurface_variant'>
        {fname} {lname}
      </p>
      <button className='flex justify-start items-center gap-1 py-2 text-onsurface hover:bg-surface_dim w-full rounded transition-all duration-200 ease-in-out' onClick={() => removeUser(phoneNum)}>
        <MdIcon className='text-base material-icons'>logout</MdIcon>
        <p className='text-sm'>خروج از حساب</p>
      </button>
    </div>
  )
}

export const UserMenuContainer = memo(UserMenuContainerComponent)