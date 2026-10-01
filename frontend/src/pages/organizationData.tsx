import { useCallback, useState, useMemo } from 'react';
import { organizationGroup, previousGroup } from '@/types/organizationData';
import { GroupDataPopover } from '@/components/common/popoverContent/groupDataPopover';
import useUploading from '@/context/uploadingContext';
import { initial_organization_data_group } from '@/constants/organizationData';
import { GroupDataContainer } from '@/components/groupData/groupDataContainer/groupDataContainer';
import { GroupDataHeader } from '@/components/groupData/groupDataHeader/groupDataHeader';

const OrganizationData = () => {
  const [previousGroups, setPreviousGroups] = useState<previousGroup[]>([initial_organization_data_group]);
  const [showDocuments, setShowDocuments] = useState<boolean>(false);
  const { setModalState } = useUploading();

  const handleAddClick = useCallback(() => {
    setModalState(true);
  }, []);

  const handleBack = useCallback((previousGroup: previousGroup) => {
    setPreviousGroups((prev) => prev.slice(0, prev.indexOf(previousGroup) + 1));
    setShowDocuments(!previousGroup.resolveToGroup);
  }, [setPreviousGroups]);

  const handleOpenGroup = useCallback((organizationGroup: organizationGroup) => {
    setPreviousGroups((prev) => [
      ...prev,
      {
        title: organizationGroup.title,
        id: organizationGroup.id,
        resolveToGroup: organizationGroup.resolve === 'groups',
      },
    ]);
    setShowDocuments(organizationGroup.resolve !== 'groups');
  }, []);

  const memoizedPreviousGroups = useMemo(() => previousGroups, [previousGroups]);
  const memoizedShowDocuments = useMemo(() => showDocuments, [showDocuments]);
  const memoizedDataContainerGroupId = useMemo(() => previousGroups[previousGroups.length - 1].id , [previousGroups])

  return (
    <section dir='rtl' className="w-full h-full relative flex flex-col justify-start items-start gap-6 md:p-8 p-4">
      <GroupDataHeader
        previousGroups={memoizedPreviousGroups}
        handleBack={handleBack}
      />
      <GroupDataContainer
        previousGroupId={memoizedDataContainerGroupId}
        showDocuments={memoizedShowDocuments}
        handleOpenGroup={handleOpenGroup}
      />
      <GroupDataPopover
        handleAddClick={handleAddClick}
      />
    </section>
  );
};

export default OrganizationData;