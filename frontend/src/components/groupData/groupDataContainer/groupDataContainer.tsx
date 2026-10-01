import React, { memo } from 'react'
import { organizationGroup } from '@/types/organizationData'
import { FolderDataContainer } from './folderData/folderDataContainer'
import { FileDataContainer } from './fileData/fileDataContainer'

interface IGroupDataContainerProps {
  previousGroupId: string,
  handleOpenGroup: (organizationGroup: organizationGroup) => void
  showDocuments: boolean
}

const groupDataContainerComponent: React.FC<IGroupDataContainerProps> = ({
  previousGroupId,
  handleOpenGroup,
  showDocuments
}) => {

  return (
    <div className='w-full h-full flex flex-col gap-4 justify-start items-start pr-4'>
    {/* filtering feature */}
    {/* <ListFilters /> */}
    {
      <div className='w-full h-full flex flex-col justify-start items-start gap-8 pb-8'>
        {
          !showDocuments ?
            <FolderDataContainer group_id={previousGroupId} handleOpenGroup={handleOpenGroup} />
            :
            <FileDataContainer group_id={previousGroupId} />
        }
      </div>
    }
  </div>  )
}

export const GroupDataContainer = memo(groupDataContainerComponent)