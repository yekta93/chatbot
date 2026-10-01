import { document } from '@/types'
import { memo } from 'react'

const docMessagingObjectsComponent = ({previewedDocument}:{previewedDocument:document}) => {
  return (
    <div className='lg:w-2/3 w-full relative h-full overflow-hidden rounded-2xl'>
        <object data={previewedDocument.src} className='rounded-2xl' type="application/pdf" width="100%" height="100%">
          <p>Alternative text - include a link <a href={previewedDocument.src}>to the PDF!</a></p>
        </object>
      </div>
  )
}

export const DocMessagingObjects = memo(docMessagingObjectsComponent)