import { MdIcon, MdIconButton } from '@/material'
import { fileDisplays, uploadedFieldType, uploadedFileRow } from '@/types/personalData'
import React, { memo, ReactNode } from 'react'
import { PersonalDataRowActions } from './personalDataRowActions/personalDataRowActions'
import { cn } from '@/lib/utils'
import { Tooltip } from 'react-tooltip'
import { tooltip_style_setting } from '@/constants'

interface IpersonalDataRowProps {
  row: uploadedFileRow,
  displays: fileDisplays,
  isSelected: boolean,
  onDelete: (id: string) => void,
  onDownload: (id: string) => void,
  onSelectRow: (id: string) => void,
  fieldRenderFormat: (value: string, type: uploadedFieldType) => ReactNode,
}

const personalDataRowComponent: React.FC<IpersonalDataRowProps> = ({
  row,
  displays,
  isSelected,
  onDelete,
  onDownload,
  onSelectRow,
  fieldRenderFormat,
}) => {
  return (
    <div className='w-full flex flex-row justify-start items-center gap-2 px-2 py-2 border-t border-surface_variant'>
      {
        displays.filter((item) => item.type !== 'hidden').map((col, index) => (
          <div
            key={index}
            className='flex justify-start items-center'
            style={{ width: `${col.width}%` , maxWidth: `${col.width - 0.5}%` }}
          >
          <p
            data-tooltip-id={`${col.title}_${row.id}`}
            data-tooltip-content={String(fieldRenderFormat(row[(col.key as keyof uploadedFileRow)], col.type))}
            className='text-onsurface w-fit max-w-[90%] whitespace-nowrap overflow-hidden text-ellipsis'
            >
            {fieldRenderFormat(row[(col.key as keyof uploadedFileRow)], col.type)}
            {
              typeof fieldRenderFormat(row[(col.key as keyof uploadedFileRow)], col.type) === 'string' &&
              <Tooltip id={`${col.title}_${row.id}`} delayShow={250} style={tooltip_style_setting}/>
            }
          </p>
          </div>
        ))
      }
      <div className='w-[10%] flex justify-end items-center'>
        <MdIconButton onClick={() => onSelectRow(row.id)}>
          <MdIcon className={cn('material-icons text-base', isSelected && 'text-primary')}>
            more_vert
          </MdIcon>
        </MdIconButton>
      </div>
      {
        isSelected && <PersonalDataRowActions id={row.id} onDelete={onDelete} onDownload={onDownload} onClose={onSelectRow} />
      }
    </div>
  )
}

export const PersonalDataRow = memo(personalDataRowComponent)