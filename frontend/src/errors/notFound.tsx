import { memo } from "react"
import { Link } from "react-router-dom"

const notFoundComponent = () => {
  return (
    <div dir="rtl" className="w-full h-full flex flex-col justify-center items-center gap-4">
      <div className="w-[36rem] flex flex-col gap-4 items-center justify-center text-center bg-surface_variant p-12 rounded-xl">
        <h1 className="text-9xl vazir-bold text-primary">404</h1>
        <h2 className="text-4xl text-onsurface">صفحه مورد نظر یافت نشد</h2>
        <p className="tex-sm text-onsurface_variant w-1/2">
          مقصد دیگری را امتحان کنید یا به 
          <Link className="text-primary" to={'/'}>{" "}صفحه اصلی{" "}</Link>
          بازگردید.
        </p>
      </div>
    </div>
  )
}

export const ErrorNotFound = memo(notFoundComponent)