import { MdIcon } from '@/material'

type IAudioRecordScreen = {
  isRecording: boolean
}

const AudioRecordScreen = ({ isRecording }: IAudioRecordScreen) => {
  return (
    <div className='fixed w-screen h-screen inset-0 bg-zinc-900/40 z-20 flex justify-center items-center'>
      <div className='flex justify-center items-center w-48 h-48 bg-surface_bright opacity-85 rounded-full shadow relative'>
        <div className='w-32 h-32 flex justify-center items-center relative'>
          <div style={{ scale: isRecording ? Math.floor(Math.random() * (125 - 85 + 1) + 85) + '%' : Math.floor(Math.random() * (85 - 85 + 1) + 85) + '%' }} className='bg-tertiary_container opacity-75 absolute shape w-[100%] h-[100%] rounded-full transition-all duration-500 ease-in-out ' />
          <div style={{ scale: isRecording ? Math.floor(Math.random() * (125 - 50 + 1) + 50) + '%' : Math.floor(Math.random() * (85 - 50 + 1) + 50) + '%' }} className='bg-surface_variant opacity-50 absolute w-[100%] h-[100%] rounded-full transition-all duration-500 ease-in-out ' />
          <div style={{ scale: isRecording ? Math.floor(Math.random() * (125 - 50 + 1) + 50) + '%' : Math.floor(Math.random() * (85 - 50 + 1) + 50) + '%' }} className='bg-surface_variant opacity-50 absolute w-[100%] h-[100%] rounded-full transition-all duration-500 ease-in-out ' />
          <div style={{ scale: isRecording ? Math.floor(Math.random() * (125 - 50 + 1) + 50) + '%' : Math.floor(Math.random() * (85 - 50 + 1) + 50) + '%' }} className='bg-surface_variant opacity-50 absolute w-[100%] h-[100%] rounded-full transition-all duration-500 ease-in-out ' />
          <MdIcon className='material-icons text-onsurface_variant text-5xl w-full h-full absolute text-center opacity-100'>mic</MdIcon>
        </div>
      </div>
    </div>
  )
}

export default AudioRecordScreen