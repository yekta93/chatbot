import { MdIcon, MdLinearProgress } from '@/material'
import { memo } from 'react'

type IUploadCard = {
  title: string
  progressValue: string
  progressStep: string
}

const uploadCardComponent = ({ title, progressValue, progressStep }: IUploadCard) => {
  return (
    <div className="w-full py-2 px-2 hover:bg-tertiary_container flex flex-col justify-between items-center gap-4 rounded-lg cursor-pointer">
      <div className="w-full flex flex-row justify-between items-center">
        <div className="flex flex-row justify-start items-center gap-2 relative w-full">
          <MdIcon className="material-icons text-primary ">description</MdIcon>
          <h4 className="text-onsurface_variant text-sm w-[70%] overflow-hidden whitespace-nowrap text-ellipsis">{title}</h4>
        </div>

        <p className={` ${progressStep === 'done' ? 'text-primary' : 'text-onsurface_variant opacity-75'} text-left w-[30%] overflow-hidden whitespace-nowrap text-ellipsis text-xs`}>{progressStep}</p>
      </div>
      {progressStep === 'done' || progressStep === 'failed' ?
        <></> :
        <div className="w-full flex flex-row justify-center items-center gap-2">
          <MdLinearProgress value={parseInt(progressValue)/100} className="w-full" />
          <p className="text-onsurface_variant opacity-75 text-xs">{progressValue}%</p>
        </div>
      }
    </div>
  )
}

export const UploadCard = memo(uploadCardComponent)