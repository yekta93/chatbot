import { memo, useEffect, useRef, useState } from 'react'
import { seededRandom } from '@/lib/utils'
import { MdFilledIconButton, MdIcon, MdLinearProgress } from '@/material'
import { isMobile } from 'react-device-detect'

const AudioFileComponent = ({ url }: { url: string | undefined }) => {
  const ref = useRef<HTMLAudioElement>(null)
  const [isPaused, setIsPaused] = useState(ref.current?.paused)
  const [playedLength, setPlayedLength] = useState(100)
  const [audioBlobs, setAudioBlobs] = useState<number[]>([])
  const [refAquired, setRefAquired] = useState(false)
  const [duration, setDuration] = useState<number>(0)

  useEffect(() => {
    setIsPaused(ref.current?.paused)
  }, [ref.current?.paused]);

  useEffect(() => {
    const temp_items = []
    if (ref.current?.duration) {
      for (let i = 0; i < (isMobile ? 12 : 33); i++) {
        temp_items.push(seededRandom(parseInt(ref.current?.duration.toString()) * 1000000 + (i ** i)) * (100 - 50) + 50)
      }
      setAudioBlobs(temp_items)
      setDuration(ref.current?.duration)
    }
  }, [refAquired])

  const handlePlayAudio = () => {
    isPaused !== false ? ref.current?.play() : ref.current?.pause()
    setIsPaused(isPaused !== false ? false : true)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current?.currentTime && !isPaused)
        setPlayedLength(100 - (ref.current?.currentTime / ref.current?.duration * 100))
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='md:w-96 w-full overflow-hidden h-20 bg-surface_variant px-4 relative rounded-lg flex flex-row-reverse justify-start items-center gap-4'>
      <MdFilledIconButton onClick={handlePlayAudio} className='min-w-[2.5rem] min-h-[2.5rem]'>
        <MdIcon className='material-icons'>{isPaused !== false ? 'play_arrow' : 'pause'}</MdIcon>
      </MdFilledIconButton>
      <audio onDurationChange={() => setRefAquired(true)} ref={ref} src={url} onEnded={() => { setIsPaused(true), setPlayedLength(100) }} />
      <div className='w-full h-1/3 flex justify-between items-center gap-0.5 relative'>
        {
          audioBlobs.length <= 0 ? <MdLinearProgress indeterminate /> : <>
            {audioBlobs.map((item, index) =>
              <div key={index} style={{ height: item + '%' }} className='w-[0.25em] flex-1 bg-primary rounded-full' />
            )}
          </>
        }
        <div style={{ width: `${playedLength}%` }} className='absolute h-full bg-surface_variant opacity-75 ' />
      </div>
      <p className='text-onsurface_variant text-sm'>{`
          ${Math.floor((duration / 100 / 60) << 0).toString().padStart(2, "0")}:${Math.floor((duration)).toString().padStart(2, "0")}
          `}
      </p>
    </div>
  )
}

export const AudioFile = memo(AudioFileComponent)