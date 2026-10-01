import { MdOutlinedTextField } from '@/material'
import { memo } from 'react'

type ITextField = {
  label: string,
  placeholder: string,
  replaceWith?: string,
  id: string,
  value: string,
  onChange: (value: string) => void,
  onSubmit?: () => void
}

const textFieldComponent = ({
  label,
  placeholder,
  value,
  onChange,
  onSubmit
}: ITextField) => {
  
  return (
    <div className='w-full h-full'>
      <MdOutlinedTextField
        className='w-full'
        label={label}
        value={value}
        placeholder={placeholder}
        onInput={(e)=> onChange(e.currentTarget.value)}
        onKeyDown={(e) => (e.key === 'Enter' && onSubmit) && onSubmit() }
      />
    </div>
  )
}

export const TextField = memo(textFieldComponent)