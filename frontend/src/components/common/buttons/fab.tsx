import { MdIcon, MdRipple } from '@/material'
import { memo, MouseEventHandler, ReactNode } from 'react'

type IFab = { disabled?: boolean, isExpanded: boolean, showMore?: boolean, variant: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'four', icon: ReactNode, title: string, handleClick: MouseEventHandler<HTMLButtonElement> }

const fabComponent = ({ disabled, isExpanded, variant, icon, title, showMore, handleClick }: IFab) => {
  return (
    <button disabled={disabled} onClick={handleClick} dir='rtl' className={`relative min-h-[56px] rounded-2xl flex flex-row justify-start
      ${variant === 'primary' ? 'bg-primary text-onprimary' :
        variant === 'secondary' ? 'bg-surface_bright text-onsurface_variant' :
          variant === 'surface' ? 'bg-surface_variant text-onsurface_variant' :
            variant === 'four' ? 'bg-whtie text-onsurface_variant' : 'bg-surface_variant text-onsurface'
      } items-center
      ${isExpanded ? 'min-w-[80%] w-[85%]' : ' min-w-[56px]'} 
      ${disabled && 'opacity-30'} 
      px-4 transition-all duration-300 ease-in-out `}>
      <MdRipple>
      </MdRipple>
      <MdIcon slot="icon" className="material-icons">{icon}</MdIcon>
      <span className={`${isExpanded ? 'opacity-100 px-2' : 'opacity-0 text-[0px]'} transition-all duration-300 ease-in-out mt-1`}>{title}</span>
      {variant === 'tertiary' && <MdIcon className='material-icons absolute left-4'>{showMore ? 'arrow_drop_up' : 'arrow_drop_down'}</MdIcon>}
    </button>
  )
}

export const Fab = memo(fabComponent)