import { tooltip_style_setting } from '@/constants'
import { formatMetadataTypes, handleFormatMetadata } from '@/lib/utils'
import { MdIcon } from '@/material'
import { document, genericObject } from '@/types'
import React, { memo } from 'react'
import { Tooltip } from 'react-tooltip'

interface IDocPreviewDetailsComponent {
    displays: genericObject<genericObject<string>>
    previewedDocument: document
}

const docPreviewDetailsComponent: React.FC<IDocPreviewDetailsComponent> = ({ displays, previewedDocument }) => {
    return (
        <div className='w-full h-full bg-surface_variant rounded-lg flex flex-col gap-2 justify-start items-start p-4'>
            <div className='w-full flex flex-row justify-between items-center gap-8'>
                <div className='w-full flex flex-row justify-start items-center gap-2'>
                    <MdIcon className='material-icons text-primary'>description</MdIcon>
                    <h4 className='vazir-bold text-lg'>{previewedDocument.name}</h4>
                </div>
            </div>
            <div className='w-full h-fit flex flex-col justify-start gap-4 items-start px-4'>
                <div className='flex 2xl:flex-row flex-col justify-start items-start gap-2'>
                    <p>تاریخ ایجاد سند:</p>
                    <p>{handleFormatMetadata(previewedDocument.creation_ts, 'date')}</p>
                </div>
                <div className='flex 2xl:flex-row flex-col justify-start items-start gap-2'>
                    <p>برچسب‌ها:</p>
                    <div className='flex flex-wrap gap-2'>
                        {
                            previewedDocument.tags.map((tag, index) =>
                                <div key={index} className='max-w-[6rem] events bg-surface_bright hover:text-ontertiary_fixed hover:bg-tertiary_fixed transition-all duration-300 ease-in-out border border-onsurface_variant px-2 py-0.5 rounded-md'>
                                    <p data-tooltip-content={tag} data-tooltip-id={`${index}_${tag}`} className='text-xs whitespace-nowrap text-ellipsis overflow-hidden'>
                                        {tag}
                                    </p>
                                    <Tooltip id={`${index}_${tag}`} style={{
                                        ...tooltip_style_setting,
                                        backgroundColor: "var(--md-sys-color-surface)"
                                        }} />
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            <div className='w-full h-full overflow-y-auto flex flex-col justify-start items-start gap-4 p-4'>
                <h4 className='text-base vazir-medium'>جزییات فایل</h4>
                {Object.keys(displays).map((displayKey, index) =>
                    <div key={index} className='flex 2xl:flex-row flex-col justify-start items-start gap-2'>
                        <p>{displays[displayKey].title}:</p>
                        <p>{handleFormatMetadata(previewedDocument.metadata[displayKey] ?? '', displays && displays[displayKey].type as formatMetadataTypes)}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export const DocPreviewDetails = memo(docPreviewDetailsComponent)