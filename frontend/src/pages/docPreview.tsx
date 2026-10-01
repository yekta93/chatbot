import DocPreviewObject from '@/components/docPreview/docPreviewObject/docPreviewObject';
import DocPreviewStatistic from '@/components/docPreview/docPreviewStatistic/docPreviewStatistic';
import useGroupData from '@/context/groupDataContext';
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';

const DocPreview = () => {
  const { id } = useParams();
  const { setDisplays, setPreviewDocument, previewedDocument } = useGroupData()
  const [isLoading, setIsLoading] = useState(true)

  const handleDocFetch = async () => {
    if (id) {
      await setDisplays({
        group_id: '',
        doc_id: id,
        partial: false
      })
      await setPreviewDocument({
        doc_id: id,
        personal: false
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    id &&
      handleDocFetch()
  }, [id])

  return (
    <section className="w-full h-[100%] relative flex lg:flex-row flex-col-reverse justify-between items-center gap-4 p-4">
      {
        !isLoading &&
        <>
          <DocPreviewStatistic/>

          <div className='lg:w-2/3 w-full relative lg:h-full h-1/2 overflow-hidden rounded-2xl'> 
          <DocPreviewObject id={id} previewedDocument={previewedDocument}/>
          </div>
        </>
      }
    </section>
  )
}

export default DocPreview