import { MdFab, MdIcon } from '@/material'
import { document } from '@/types'
import { Link } from 'react-router-dom'

type IDocPreviewObject = {
    id: string | undefined,
    previewedDocument: document
}

const DocPreviewObject = ({id , previewedDocument}: IDocPreviewObject) => {
  return (
    <>
    <Link to={`/messaging/${id}`}>
      <MdFab variant='primary' className='absolute bottom-4 left-8'>
        <MdIcon slot='icon' className='material-icons'>chat</MdIcon>
      </MdFab>
    </Link>
    <object data={previewedDocument.src} className='rounded-2xl' type="application/pdf" width="100%" height="100%">
      <p>Alternative text - include a link <a href={previewedDocument.src}>to the PDF!</a></p>
    </object>
  </>  )
}

export default DocPreviewObject