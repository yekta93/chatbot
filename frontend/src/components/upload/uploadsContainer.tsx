import useUploading from '@/context/uploadingContext'
import { UploadCard } from './uploadCard'
import { useOutsideClick } from '@/hooks/use_outside_click'
import { useEffect } from 'react'
import { MdIcon } from '@/material'

type IuploadsContianer = {
  outsideClick: () => void
  isOpen: boolean
}

const UploadsContainer = ({ outsideClick, isOpen }: IuploadsContianer) => {
  const { uploadingFiles, setUploadingFilesHistory, setUploadingFile, setUploadingFiles } = useUploading()

  const handleFetchUploads = async () => {
    await setUploadingFilesHistory(20)
  }

  useEffect(() => {
    handleFetchUploads()
  }, [])

  useEffect(() => {
    handleUploadingFileRefetch()
  }, [uploadingFiles, isOpen])

  const ref = useOutsideClick(() => {
    if (isOpen)
      outsideClick()
  });

  const handleUploadingFileRefetch = () => {
    if (isOpen) {
      uploadingFiles.map((uploadingFile) => {
        if (uploadingFile.state === 'processing') {
          const interval = setInterval(() => {
            setUploadingFile(uploadingFile.doc_id).then((res) => {
              res && setUploadingFiles(uploadingFiles, res)
              res?.state !== 'processing' && clearInterval(interval);
              !isOpen && clearInterval(interval);
            })
          }, 1000);

          return () => clearInterval(interval);
        }
      })
    }
  }

  return (
    <div ref={ref} dir="rtl" className={`w-80 ${isOpen ? 'max-h-96 p-2' : 'max-h-0 p-0'} transition-all duration-300 ease-in-out overflow-y-auto bg-surface_variant shadow-sm overflow-hidden rounded-lg fixed top-16 left-14 flex flex-col justify-start items-center gap-2`}>
      {
        uploadingFiles.length ?
          uploadingFiles.map((uploadItem, index) => (
            <UploadCard
              key={index}
              title={uploadItem.name}
              progressStep={uploadItem.state}
              progressValue={((uploadItem.status.length / uploadItem.number_total_steps) * 100).toFixed(2)}
            />
          )) :
          <div className='w-full text-xs flex flex-col justify-center items-center gap-2 p-4'>
            <MdIcon className='material-icons'>notifications_off</MdIcon>
            <p>فایلی بارگزاری نشده است</p>
          </div>
      }
    </div>
  )
}

export default UploadsContainer