import { MdIcon } from '@/material'
import { document } from '@/types'
import { memo } from 'react'

const docRelatedCardComponent = ({doc}:{doc:document}) => {
    return (
        <div key={doc.doc_id} className='lg:w-full w-24 h-full bg-surface_bright text-onsurface_variant rounded-lg flex flex-col justify-between items-center p-4'>
            <MdIcon className='material-icons h-fit w-fit flex justify-center items-center lg:text-7xl text-5xl'>description</MdIcon>
            <p className='w-20 whitespace-nowrap overflow-hidden text-ellipsis'>
                {doc.name}
            </p>
        </div>
    )
}

export const DocRelatedCard = memo(docRelatedCardComponent)