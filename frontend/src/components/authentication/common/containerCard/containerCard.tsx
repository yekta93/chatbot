import {FunctionComponent, memo, PropsWithChildren} from 'react';

const containerCardComponent: FunctionComponent<PropsWithChildren> = ({children}) =>{
  return (
    <div dir='rtl' className='w-3/5 h-fit p-12 bg-surface_bright rounded-2xl flex flex-row items-start justify-between gap-24'>
      {children}
    </div>
  )
}

export const AuthContainerCard = memo(containerCardComponent)