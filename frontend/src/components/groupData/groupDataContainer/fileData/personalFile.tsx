import { tooltip_style_setting } from '@/constants'
import { formatMetadataTypes, handleFormatMetadata } from '@/lib/utils'
import { MdIcon } from '@/material'
import { document, genericObject } from '@/types'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'

interface folder extends document {
  handleClick?: () => void
  displays?: genericObject<genericObject<string>>
  topHalf: boolean
  type: 'table' | 'document' | 'chat-document'
}

export const PersonalFile = ({ type, doc_id, displays, tags, metadata }: folder) => {
  const navigate = useNavigate()

  return (
    <div className='w-full border-b border-surface_variant py-4  text-onsurface flex flex-row justify-start items-center gap-6 px-4 '>
      {
        Object.keys(displays ?? {}).map((key, index) =>
          <div onClick={() => type !== 'table' && navigate(`/doc-preview/${doc_id}`)} key={index}
            className={`cursor-pointer w-64 flex justify-start items-center gap-1`}>
            {
              index === 0 && type !== 'table' &&
              <MdIcon className='material-icons -mt-1 scale-75 text-primary'>description</MdIcon>
            }
            <p data-tooltip-id={`${index}_${key}`} data-tooltip-content={metadata[key]} className='w-fit overflow-hidden text-ellipsis whitespace-nowrap'>
              <Tooltip id={`${index}_${key}`} delayShow={500} style={tooltip_style_setting}/>
              {handleFormatMetadata(metadata[key], displays && displays[key].type as formatMetadataTypes)}
            </p>
          </div>
        )
      }
      <div className='w-48 max-h-[2rem] flex-1 flex flex-wrap justify-start items-start overflow-x-hidden gap-2'>
        {
          tags.map((tag, index) =>
            <div key={index} className='max-w-[6rem] events bg-surface_bright hover:text-ontertiary_fixed hover:bg-tertiary_fixed transition-all duration-300 ease-in-out border border-onsurface_variant px-2 py-0.5 rounded-md'>
              <p data-tooltip-content={tag} data-tooltip-id={`${index}_${tag}`} className='text-xs whitespace-nowrap text-ellipsis overflow-hidden'>
                {tag}
              </p>
              <Tooltip id={`${index}_${tag}`} style={tooltip_style_setting}/>
            </div>
          )
        }
      </div>
      {/* {
        type !== 'table' &&
        <MenuPopover
          scrollLock={false}
          cn={` ${topHalf ? 'translate-y-[60%]' : '-translate-y-[60%]'} -translate-x-[30%] absolute`}
          items={[
            { title: 'تغییر نام', icon: 'edit' },
            { title: 'بارگیری', icon: 'download' },
            { title: 'بارگذاری', icon: 'upload' },
            { title: 'حذف', icon: 'delete' },
          ]}/>
      } */}
    </div >
  )
}