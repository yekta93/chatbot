import { memo, useCallback, useState } from 'react'
import { GroupDataPopover } from '@/components/common/popoverContent/groupDataPopover'
import { GroupDataHeader } from '@/components/groupData/groupDataHeader/groupDataHeader'
import useUploading from '@/context/uploadingContext';
import { MdIcon } from '@/material';
import { PersonalDataRow } from '@/components/personalData/personalDataContainer/personalDataRow/personalDataRow';
import { PersonalDataDisplay } from '@/components/personalData/personalDataContainer/personalDataDisplay/personalDataDisplay';
import { uploadedFilesDisplay } from '@/constants/personalData';
import { uploadedFieldType } from '@/types/personalData';
import { cn } from '@/lib/utils';

const PersonalDataComponent = () => {
  const [selectedRowId, setSelectedRowId] = useState<string>()
  const { setModalState } = useUploading();
  const { uploadingFiles, setUploadingFilesHistory } = useUploading();

  const handleAddClick = useCallback(() => {
    setModalState(true);
  }, []);

  const handleDataRefresh = useCallback(() => {
    setUploadingFilesHistory(20)
  }, [])

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRowId(id)
  }, [])

  const handlefieldRenderFormat = useCallback((value: string, type: uploadedFieldType) => {
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('fa-IR')
      case 'status':
        const icon = value === 'done' ? 'check_circle' : value === 'failed' ? 'error' : 'restart_alt';

        return <div className={cn(
          'flex flex-row  justify-between items-center',
          value === 'done' ? 'text-primary' : value === 'failed' ? 'text-error' : 'text-secondary'
        )}>
          <MdIcon className='material-icons text-base text-right'>{icon}</MdIcon>
          <p className='w-[90%] text-wrap break-words'>{value}</p>
        </div>
      case 'type':
        const valueLength = value.length;
        return <div className='flex justify-start items-center px-3'>
          <div className='px-2 py-0.5  bg-surface_variant rounded'>
            <p>{value.slice(valueLength - 3)}</p>
          </div>
        </div>
      case 'text':
        return value
      default:
        return value.toString()
    }
  }, [])

  return (
    <section dir='rtl' className="w-full h-full relative flex flex-col justify-start items-start gap-6 md:p-8 p-4">
      <GroupDataHeader
        previousGroups={[{
          title: 'اطلاعات شخصی',
          id: 'personal-data',
          resolveToGroup: false
        }]}
        handleBack={handleDataRefresh}
      />
      {
        uploadingFiles.length ?
          <div className='w-full h-full lg:flex hidden flex-col gap-4 text-sm'>
            <PersonalDataDisplay displays={uploadedFilesDisplay} />
            <div className='w-full h-fit lg:flex hidden flex-col text-sm overflow-y-auto'>
            {
              uploadingFiles.map((file) =>
                <PersonalDataRow
                  key={file.doc_id}
                  row={{
                    id: file.doc_id,
                    name: file.name,
                    creation_ts: file.creation_ts,
                    status: file.status.at(-1)?.name ?? '',
                    file_type: file.name,
                  }}
                  isSelected={file.doc_id === selectedRowId}
                  displays={uploadedFilesDisplay}
                  onDelete={(id: string) => console.log(id)}
                  onDownload={(id: string) => console.log(id)}
                  fieldRenderFormat={handlefieldRenderFormat}
                  onSelectRow={handleSelectRow}
                  />
                )
              }
            </div>
          </div>
          : <div className='w-full h-[70vh] rounded-lg flex flex-col gap-8 justify-center items-center'>
            <div className='flex gap-8 flex-col w-full justify-center items-center'>
              <MdIcon className='w-fit h-fit text-onsurface_variant material-icons text-5xl'>info</MdIcon>
              <p className='text-sm text-onsurface_variant'>
                داده ای بارگذاری نشده است.
              </p>
            </div>
          </div>
      }
      <GroupDataPopover
        handleAddClick={handleAddClick}
      />
    </section>)
}

export const PersonalData = memo(PersonalDataComponent)