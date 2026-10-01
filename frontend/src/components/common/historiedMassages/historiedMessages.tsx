import { useOutsideClick } from '@/hooks/use_outside_click'
import { MdIcon, MdIconButton, MdRipple } from '@/material'
import { IStep } from '@chainlit/react-client'

type IHistoriedMessages = {
  inputValue: string
  historiedMessageOpen: boolean
  handleHistoriedMessageReset: () => void
  historiedMessages: IStep[]
  selectedHistoriedMessage: number
  handleOutsideClick: () => void
  handleSelectMessage: (message: IStep) => void
}

const HistoriedMessages = ({
  inputValue,
  historiedMessageOpen,
  handleHistoriedMessageReset,
  historiedMessages,
  selectedHistoriedMessage,
  handleOutsideClick,
  handleSelectMessage
 }: IHistoriedMessages) => {

  const ref = useOutsideClick(() => {
    handleOutsideClick()
  });

  return (
    <>
      {
        inputValue.length <= 0 && historiedMessageOpen &&
        <div ref={ref} dir='rtl' className='absolute top-0 right-0 shadow px-6 py-4 rounded-lg w-1/2 bg-surface_variant flex flex-col justify-center items-start -translate-y-[100%] -mt-2'>
          <div className='w-full h-8 flex flex-row-reverse justify-between items-center'>
            <MdIconButton onClick={() => { localStorage.clear(); handleHistoriedMessageReset() }}>
              <MdIcon className="material-icons">delete</MdIcon>
            </MdIconButton>
            <h3 className='vazir-bold text-onsurface'>
              پیام‌های پیشین
            </h3>
          </div>
          <div className='w-full border-b border-onsurface_variant opacity-50 mb-2 mt-1' />
          <div className='flex flex-col gap-0 justify-start items-start w-full max-h-[30vh] overflow-y-auto'>
            {historiedMessages &&
              historiedMessages.map((historiedMessage: IStep, index: number) =>
                <p 
                  onClick={()=>handleSelectMessage(historiedMessage)}
                  key={index} 
                  className={`
                    ${index === (selectedHistoriedMessage > 0 ? historiedMessages.length - selectedHistoriedMessage : Math.abs(selectedHistoriedMessage)) ? 'text-sm vazir-bold text-onsurface bg-surface_dim ' : 'text-xs text-onsurface_variant'}
                     relative min-h-[2rem] cursor-pointer px-2 rounded-lg py-2 w-[98%] overflow-hidden text-ellipsis whitespace-nowrap
                     `}
                >
                  <MdRipple />
                  {historiedMessage.output}</p>
              )}
          </div>
        </div>
      }
    </>
  )
}

export default HistoriedMessages