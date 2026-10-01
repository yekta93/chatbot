import React, { memo } from 'react';
import { MdFab, MdIcon } from '@/material'

interface IGroupDataPopoverProps {
    handleAddClick: () => void;
}

const groupDataPopoverComponent: React.FC<IGroupDataPopoverProps> = ({
    handleAddClick
}) => {
    return (
        <>
            {/* <div ref={ref} className={`bg-surface_bright menu__popover-shadow overflow-hidden whitespace-nowrap ${fabMenuOpen ? 'w-48 h-fit p-3' : 'w-0 h-0'} flex flex-col justify-start items-start gap-1 transition-all ease-in-out duration-200 rounded-2xl fixed md:left-12 left-6 md:bottom-28 bottom-24`}>
                <IconButton variant="secondary" icon="folder" title='ایجاد پوشه' isExpanded={true} />
                <IconButton handleClick={()=>{setModalState(true);setFabMenuOpen(false)}} variant="secondary" icon="upload_file" title='بارگذاری فایل' isExpanded={true} />
            </div> */}
            <MdFab onClick={handleAddClick} variant='primary' className='fixed md:left-12 left-6 md:bottom-12 bottom-6'>
                <MdIcon className='material-icons' slot='icon'>add</MdIcon>
            </MdFab>

        </>
    )
}

export const GroupDataPopover = memo(groupDataPopoverComponent)