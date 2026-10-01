import { memo, useState } from 'react'
import { useOutsideClick } from '@/hooks/use_outside_click'
import { IconButton } from '../buttons/iconButton'

type IMenuPopover = { items: { title: string, icon: string }[], cn?: string, scrollLock: boolean }

const MenuPopoverComponent = ({ items, cn,scrollLock }: IMenuPopover) => {
  const [actionsView, setActionsView] = useState<boolean>(false)
  const ref = useOutsideClick(() => {
    if (actionsView)
      setActionsView(actionsView ? false : actionsView)
  });

  // TODO : the whole popover needs some improvement

  return (
    <div className={`flex w-fit h-fit justify-end items-center`}>
      { scrollLock && <div onScroll={(e) => e.preventDefault()} className={`w-screen h-screen fixed z-20 inset-0 ${actionsView ? 'pointer-events-auto' : 'pointer-events-none'}`} /> }
      <div
        style={{ willChange: 'transform' }}
        className={`${cn} ${actionsView ? 'opacity-100' : 'opacity-0 pointer-events-none'} menu__popover-shadow w-fit whitespace-nowrap h-fit transition-all duration-300 ease-in-out flex flex-col gap-2 bg-surface_bright rounded-md z-50 `} ref={ref}>
        {items.map((menuItem, index) =>
          <IconButton
            disabled={false}
            key={index}
            title={menuItem.title}
            isExpanded={true}
            variant="menu"
            icon={menuItem.icon}
          />
        )}
      </div>
    </div>
  )
}

export const MenuPopover = memo(MenuPopoverComponent)