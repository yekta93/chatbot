import { MdCircularProgress } from '@/material'
import { memo } from 'react'

const loadingComponent = () => {
  return (
    <div className='w-full h-full layout bg-surface_variant flex items-center justify-center'>
      <MdCircularProgress indeterminate className="!size-32" />
    </div>
  )
}

export const Loading = memo(loadingComponent)