import React, { memo, useCallback, useEffect, useState } from 'react'
import { PersonalFolder } from './personalFolder'
import { MdCircularProgress, MdIcon } from '@/material'
import useGroupData from '@/context/groupDataContext'
import { organizationGroup } from '@/types/organizationData';

interface IFolderDataContainerProps {
  group_id: string;
  handleOpenGroup: (organizationGroup: organizationGroup) => void;
}

const FolderDataContainerComponent: React.FC<IFolderDataContainerProps> = ({
  group_id,
  handleOpenGroup
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { groups, setGroups } = useGroupData()

  const handleGetDocuments = useCallback(
    async () => {
      await setGroups(group_id, false)
      setIsLoading(false)
    },[group_id])
  

  useEffect(() => {
    group_id !== undefined &&
      handleGetDocuments()
  }, [group_id])

  return (
    <div className='flex flex-col w-full h-fit gap-4 justify-start items-start'>
      <div className='w-full h-fit text-onsurface flex justify-between items-center'>
        <h5>پوشه‌ها</h5>
      </div>
      {
        isLoading ?
          <div className='w-full h-full flex justify-center items-center'>
            <MdCircularProgress indeterminate />
          </div> :
          <>
            {
              groups.length > 0 ?
                <div className='w-full h-fit flex flex-wrap gap-1'>
                  {groups.map((group) =>
                    <PersonalFolder
                      key={group.group_id}
                      id={group.group_id}
                      handleClick={handleOpenGroup}
                      title={group.name}
                      description={group.description}
                      resolve={group.resolve_to}
                    />
                  )}
                </div>
                :
                <div className='w-full h-[60vh] rounded-lg flex flex-col gap-8 justify-center items-center'>
                  <div className='flex gap-8 flex-col w-full justify-center items-center'>
                    <MdIcon className='w-fit h-fit text-onsurface_variant material-icons text-5xl'>info</MdIcon>
                    <p className='text-sm text-onsurface_variant'>
                      پوشه مورد نظر خالی میباشد
                    </p>
                  </div>
                </div>
            }
          </>}

    </div>)
}

export const FolderDataContainer = memo(FolderDataContainerComponent)