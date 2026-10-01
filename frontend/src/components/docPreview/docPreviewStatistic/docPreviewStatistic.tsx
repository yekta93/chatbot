import useGroupData from '@/context/groupDataContext'
import { DocPreviewDetails } from './docPreviewDetails/docPreviewDetails'

const DocPreviewStatistic = () => {
    const { displays, previewedDocument } = useGroupData()

    return (
        <div dir='rtl' className='lg:w-1/3 w-full text-sm lg:h-full h-1/2 flex flex-col justify-center items-center gap-2'>
            <DocPreviewDetails displays={displays} previewedDocument={previewedDocument}/>
            {/* related documents feature */}
            {/* <DocPreviewRelates documents={documents}/> */}
        </div>
    )
}

export default DocPreviewStatistic