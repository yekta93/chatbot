import { DiscoveryCard } from '@/components/common/cards/discoveryCard'
import React, { memo } from 'react';

interface ILandingStatisticsProps {
    handleSendMessage: (subtitle: string) => void
}

const LandingStatisticsComponents: React.FC<ILandingStatisticsProps> = ({
    handleSendMessage,
}) => {
    return (
        <>
            <h2 className="text-xl w-full text-center">
                سلام، اگر درباره موضوع مشخصی سوال داری از من بپرس.
            </h2>
            <div className='w-full flex md:flex-row flex-col justify-between items-center gap-4'>
                <DiscoveryCard
                    subtitle='نمودار میزان فروش کل را به تفکیک مدیران فروش رسم کن.'
                    variant="main"
                    title='نمودار'
                    handleOnClick={(message: string) => handleSendMessage(message)}
                />
                <div className='h-full flex flex-col gap-4 justify-center items-center'>
                    <DiscoveryCard
                        title='پایگاه داده'
                        variant='tertiary'
                        subtitle='اطلاعات ذخیره شده در پایگاه داده را به تفکیک جداول موجود برایم بنویس.'
                        handleOnClick={(message: string) => handleSendMessage(message)}
                    />
                    <DiscoveryCard
                        title='قرارداد'
                        subtitle='با توجه به تمام قراردادهای موجود، مبلغ کل ضمانت‌های تهیه‌ شده برای کلیه‌ی قراردادهای شرکت را برایم بنویس.'
                        handleOnClick={(message: string) => handleSendMessage(message)}
                    />
                </div>
            </div>
        </>
    )
}

export const LandingStatistics = memo(LandingStatisticsComponents)