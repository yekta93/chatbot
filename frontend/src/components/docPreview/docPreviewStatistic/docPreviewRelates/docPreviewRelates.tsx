import { DocRelatedCard } from '@/components/common/cards/docRelatedCard'
import { document } from '@/types'
import { memo } from 'react'

const docPreviewRelatesComponent = ({ documents }: { documents: document[] }) => {
    return (
        <div className='w-full h-1/3 bg-surface_variant rounded-lg lg:flex hidden flex-col gap-4 justify-start items-start p-4'>
            <h4 className='text-lg vazir-medium'>فایل‌های مرتبط</h4>
            {
                documents.length > 0 &&
                <div className='w-full h-full flex flex-row justify-between items-center gap-4'>
                    {
                        documents.slice(0, 3).map((doc) =>
                            <DocRelatedCard doc={doc} key={doc.doc_id} />
                        )
                    }
                </div>
            }
        </div>
    )
}

export const DocPreviewRelates = memo(docPreviewRelatesComponent)