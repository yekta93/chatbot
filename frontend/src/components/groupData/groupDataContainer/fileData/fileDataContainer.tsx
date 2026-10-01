import React, { memo, useCallback, useEffect, useState } from 'react'
import { PersonalFile } from './personalFile'
import { MdCircularProgress, MdIcon, MdIconButton } from '@/material'
import useGroupData from '@/context/groupDataContext'
import { useNavigate } from 'react-router-dom'
import { initial_organization_data_document } from '@/constants/organizationData'
import { Tooltip } from 'react-tooltip'
import { tooltip_style_setting } from '@/constants'

interface IFileDataContainerProps {
  group_id: string
}

const FileDataContainerComponent: React.FC<IFileDataContainerProps> = ({
  group_id
}) => {
  const { documents, displays, setDisplays, setDocuments } = useGroupData()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [openedDocument, setOpenedDocument] = useState<string>('')
  const navigate = useNavigate()


  const handleGetDocuments = useCallback(
    async () => {
      await setDisplays({
        ...initial_organization_data_document,
        group_id: group_id,
      })
      await setDocuments({
        ...initial_organization_data_document,
        group_id: group_id,
      })
      setIsLoading(false)
    }, [group_id])


  useEffect(() => {
    group_id !== undefined &&
      handleGetDocuments()
  }, [group_id])

  return (
    <div className='flex flex-col w-full h-fit gap-4 justify-start items-start'>
      <div className='w-full h-fit text-onsurface flex justify-between items-center'>
        <h5>فایل‌ها</h5>
      </div>
      {
        isLoading ?
          <div className='w-full h-full flex justify-center items-center'>
            <MdCircularProgress indeterminate />
          </div> :
          <>
            {
              documents.length > 0 ?
                <>
                  <div className='w-full h-fit lg:flex hidden flex-col gap-1 text-sm'>
                    <div className='w-full border-b border-surface_variant py-4  text-onsurface vazir-bold flex flex-row justify-start items-center gap-6 px-4 '>
                      {Object.keys(displays).map((displayKey: string, index) =>
                        <div key={index} className='w-64 flex justify-start items-start gap-1'>
                          <p className='text-onsurface w-full vazir-bold'>{displays[displayKey].title}</p>
                        </div>
                      )}
                      <div className='w-48 flex-1 flex justify-start items-center gap-1'>
                        <p className='text-onsurface w-full vazir-bold'>برچسب‌ها</p>
                      </div>
                    </div>
                    {documents.map((doc, index) =>
                      <PersonalFile
                        type='document'
                        doc_id={doc.doc_id}
                        displays={displays}
                        key={index}
                        creation_ts={doc.creation_ts}
                        metadata={doc.metadata}
                        src={doc.src}
                        tags={doc.tags}
                        topHalf={documents.length / 2 > index}
                        name={doc.name}
                      />
                    )}
                  </div>
                  <div className='w-full h-full rounded-lg flex lg:hidden flex-col gap-2 text-sm'>
                    {
                      documents.map((document, index) =>
                        <div key={index} className='w-full h-fit border-b border-surface_variant py-4 flex flex-col justify-start items-center gap-4 p-2'>
                          <div key={index} className='w-full h-full flex flex-row justify-start items-center gap-4 rounded-lg '>
                            <div onClick={() => navigate(`/doc-preview/${document.doc_id}`)} className='flex gap-1 cursor-pointer w-[80%] justify-start items-center'>
                              <MdIcon className='material-icons text-base text-primary'>description</MdIcon>
                              <p className='vazir-bold text-onsurface max-w-[100%] overflow-hidden text-ellipsis whitespace-nowrap'>{document.name}</p>
                            </div>
                            <div className='w-[20%] flex justify-end items-center'>
                              <MdIconButton onClick={() => setOpenedDocument(document.doc_id === openedDocument ? '' : document.doc_id)}>
                                <MdIcon className='material-icons text-base text-primary'>{document.doc_id === openedDocument ? 'arrow_drop_up' : 'arrow_drop_down'}</MdIcon>
                              </MdIconButton>
                            </div>
                          </div>
                          {
                            document.doc_id === openedDocument &&
                            <div className='bg-surface_variant rounded-lg w-full h-fit flex flex-col gap-2 p-2 justify-start items-start'>
                              {Object.keys(displays).map((displayKey, index) =>
                                <div key={index} className='w-64 flex flex-col justify-start items-start gap-1'>
                                  <p className='text-onsurface w-full vazir-bold'>{displays[displayKey].title} :</p>
                                  <p className='text-onsurface w-full'>{document.metadata[displayKey]}</p>
                                </div>
                              )}
                              <p className='text-onsurface w-full vazir-bold'>برچسب‌ها :</p>
                              <div className='flex flex-wrap gap-2'>
                                {
                                  document.tags.map((tag, index) =>
                                      <div key={index} className='max-w-[6rem] cursor-pointer bg-surface_variant hover:text-ontertiary_fixed hover:bg-surface_bright transition-all duration-300 ease-in-out border border-onsurface_variant px-2 py-0.5 rounded-md' >
                                        <p data-tooltip-id={`${index}_${tag}`} data-tooltip-content={tag} className='text-xs whitespace-nowrap text-ellipsis overflow-hidden'>
                                          {tag}
                                        </p>
                                        <Tooltip id={`${index}_${tag}`} style={tooltip_style_setting}/>
                                      </div>
                                  )
                                }
                              </div>
                            </div>
                          }
                        </div>

                      )
                    }
                  </div>
                </>
                : <div className='w-full h-[60vh] rounded-lg flex flex-col gap-8 justify-center items-center'>
                  <div className='flex gap-8 flex-col w-full justify-center items-center'>
                    <MdIcon className='w-fit h-fit text-onsurface_variant material-icons text-5xl'>info</MdIcon>
                    <p className='text-sm text-onsurface_variant'>
                      پوشه مورد نظر خالی میباشد
                    </p>
                  </div>
                </div>
            }
          </>
      }
    </div >
    )
}

export const FileDataContainer = memo(FileDataContainerComponent)