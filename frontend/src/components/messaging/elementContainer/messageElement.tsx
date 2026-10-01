import { document, genericObject, messagedElement } from '@/types'
import { useChatData } from '@chainlit/react-client'
import { ReactNode, useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { MdIcon } from '@/material'
import { handleFormatMetadata } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { API_ROUTE } from '@/constants/api'
import { useCookies } from 'react-cookie'

type IDashboard = {
  dashboard: messagedElement
}
export const Dashboard = ({ dashboard }: IDashboard) => {
  const [element, setElement] = useState<ReactNode>()
  const { elements } = useChatData()
  const navigate = useNavigate()
  const [cookies] = useCookies();

  const handleElementRender = async () => {
    switch (dashboard.type) {
      case 'document': {
        setElement(
          <object data={dashboard.src as string} className='rounded-2xl' type="application/pdf" width="100%" height="100%">
            <p>Alternative text - include a link <a href={dashboard.src as string}>to the PDF!</a></p>
          </object>
        )
        break;
      }

      case 'documents': {
        const display_response = await fetch(`${API_ROUTE}/documents/display${dashboard.src}`, {
          credentials: "include", headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${cookies.danayar_access_token}`
          }
        }).then((e) => e.json()).then((data) => (data))
        const detail_response: document[] = await fetch(`${API_ROUTE}/documents${dashboard.src}`, {
          credentials: "include", headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${cookies.danayar_access_token}`
          }
        }).then((e) => e.json()).then((data) => (data))

        setElement(
          <div dir='rtl' className='w-full h-full flex flex-col gap-1 bg-surface_bright'>
            <div className='w-full h-fit flex flex-col gap-1 text-sm'>
              <div className='w-full border-b border-surface_variant py-4  text-onsurface vazir-bold flex flex-row justify-start items-center gap-6 '>
                {
                  Object.keys(display_response).map((dashboardRow, index) =>
                    <p key={index} className='w-72'>
                      {display_response[dashboardRow].title}
                    </p>
                  )
                }
              </div>
              <div className='w-full flex-1 flex flex-col text-onsurface_variant justify-start items-start gap-1'>
                {
                  detail_response.map((item, index) =>
                    <div key={index} className='w-full border-b border-surface_variant py-2 flex flex-row justify-start items-center gap-6  '>
                      {
                        Object.keys(display_response).map((dashboardRow, index) =>
                          <div onClick={() => navigate(`/doc-preview/${item.doc_id}`)} className='w-72 cursor-pointer overflow-hidden flex justify-start items-center gap-2'>
                            {
                              index === 0 && <MdIcon className='material-icons text-base text-primary'>description</MdIcon>
                            }
                            <p className='w-full text-ellipsis whitespace-nowrap overflow-hidden'>
                              {handleFormatMetadata(item.metadata[dashboardRow], display_response[dashboardRow].type)}
                            </p>
                          </div>
                        )}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )
        break;
      }

      case 'table': {
        setElement(
          <div dir='rtl' className='w-full h-full p-4 bg-surface_bright overflow-y-auto'>
            <div className='w-full h-fit flex flex-col gap-1 text-sm'>
              <div className='w-full border-b border-surface_variant py-4  text-onsurface vazir-bold flex flex-row justify-start items-center gap-6 px-4 '>
                {
                  (dashboard.src as genericObject<string>[]).map((dashboardRow, index) =>
                    index === 0 &&
                    Object.keys(dashboardRow).map((key, index) =>
                      <p key={index} className='w-60'>{key}</p>
                    )
                  )
                }
              </div>
              <div className='w-full flex-1 flex flex-col  text-onsurface_variant justify-start items-start gap-1'>
                {
                  (dashboard.src as genericObject<string>[]).map((dashboardRow, index) =>
                    <div key={index} className='w-full border-b border-surface_variant py-2 flex flex-row justify-start items-center gap-6 px-4 '>
                      {
                        Object.keys(dashboardRow).map((key, index) =>
                          <p key={index} className='w-60 text-ellipsis whitespace-nowrap overflow-hidden'>
                            {dashboardRow[key]}
                          </p>
                        )

                      }
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )
        break;
      }


      case 'plotly': {
        const elementUrl = elements.find((element) => element.id === dashboard.id)?.url;
        if (elementUrl) {
          const response = await fetch(elementUrl , {
            credentials: "include", headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${cookies.danayar_access_token}`
            }
          }).then((e) => e.json()).then((data) => (data))
          setElement(
            <div className='w-full h-full flex justify-center items-center rounded-lg bg-surface_bright'>
              <Plot className='w-full h-full rounded-lg' data={response.data} layout={response.layout} />
            </div>
          )
        }
      }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    handleElementRender()
  }, [dashboard])
  return (
    <div className='w-full h-full bg-surface_variant rounded-lg overflow-hidden '>{element}</div>
  )
}
