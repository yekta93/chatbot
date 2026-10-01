import { memo } from 'react';

type IContainerHeader = {
  title: string,
  subtitle?: string,
}

const containerHeaderComponent = ({ title, subtitle }: IContainerHeader) => {
  return (
    <div className='w-fit h-full flex flex-col justify-start items-start gap-6'>
      <img src="/favicon.ico" alt="Danayar-logo" className="w-16 h-16 saturate-0 brightness-0" />
      <h1 className='text-4xl text-onsurface'>{title}</h1>
      <p className='text-base text-onsurface_variant '>{subtitle}</p>
    </div>
  )
}

export const AuthContainerHeader = memo(containerHeaderComponent)