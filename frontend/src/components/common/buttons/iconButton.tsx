import { MdIcon, MdRipple } from '@/material'
import { memo, MouseEventHandler, ReactNode } from 'react'

type IIconButton = {
  isExpanded: boolean,
  secondaryIcon?: ReactNode,
  variant: 'primary' | 'secondary' | 'menu',
  icon: ReactNode,
  title: string,
  handleClick?: MouseEventHandler<HTMLDivElement>,
  selected?: boolean
  disabled: boolean
}

const iconButtonComponent = ({ disabled, isExpanded, secondaryIcon, handleClick, variant, icon, title, selected }: IIconButton) => {
  return (
    <div onClick={(e)=> !disabled && handleClick && e && handleClick(e)} dir='rtl' className={`group relative items-center rounded-full max-w-full flex flex-row justify-between 
      ${variant === 'primary' ? '2xl:h-12 2xl:text-sm text-xs vazir-light h-10' :
        variant === 'secondary' ? 'text-xs vazir-light h-8 ' :
          'rounded-none text-xs vazir-light h-8'
      }
      ${disabled ? 'opacity-30' : 'cursor-pointer'}
      ${isExpanded ? 'min-w-full w-full' : ' min-w-[40px]'} 
      ${selected ? 'bg-surface_dim text-onsurface_variant' : 'bg-transparent text-onsurface_variant'}
      px-4 transition-all duration-300 ease-in-out `}>
      <MdRipple disabled={disabled} />
      <MdIcon slot="icon" className={`2xl:text-2xl text-base material-icons h-full`}>{icon}</MdIcon>
      <span className={`${isExpanded ? 'opacity-100 px-2 ' : 'opacity-0 text-[0px]'} w-full text-start text-ellipsis overflow-hidden transition-all duration-300 ease-in-out mt-1`}>{title}</span>
      {secondaryIcon && secondaryIcon}
    </div>
  )
}

export const IconButton = memo(iconButtonComponent)