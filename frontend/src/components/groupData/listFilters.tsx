import { MdIcon, MdRipple } from '@/material'

export const ListFilters = () => {
  return (
    <div className='w-full h-fit flex flex-row justify-between items-center'>
      <div className='flex w-full flex-wrap gap-2 justify-start items-center'>
        <div className='min-w-[6rem] relative cursor-pointer px-3 py-1 border border-onsurface_variant rounded-lg flex justify-center items-center text-xs gap-1'>
          <MdRipple />
          <MdIcon className='material-icons -mr-2 text-onsurface' slot='icon'>arrow_drop_down</MdIcon>
          <p className='vazir-base text-onsurface'>نوع فایل</p>
        </div>
        <div className='min-w-[6rem] relative cursor-pointer px-3 py-1 border border-onsurface_variant rounded-lg flex justify-center items-center text-xs gap-1'>
          <MdRipple />
          <MdIcon className='material-icons -mr-2 text-onsurface' slot='icon'>arrow_drop_down</MdIcon>
          <p className='vazir-base text-onsurface'>زمان بارگذاری</p>
        </div>
        <div className='min-w-[6rem] relative cursor-pointer px-3 py-1 border border-onsurface_variant rounded-lg flex justify-center items-center text-xs gap-1'>
          <MdRipple />
          <MdIcon className='material-icons -mr-2 text-onsurface' slot='icon'>arrow_drop_down</MdIcon>
          <p className='vazir-base text-onsurface'>آخرین تغییر</p>
        </div>
      </div>
    </div>
  )
}