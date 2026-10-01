import { memo, ReactNode } from "react";

type ILandingCard = {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: string
  handleOnClick: (message: string) => void;
};

const discoveryCardComponent = ({ title, subtitle, variant, handleOnClick }: ILandingCard) => {

  return (
    <div onClick={() => handleOnClick(subtitle ?? '')} className={` ${variant === 'tertiary' ? 'h-fit' : 'h-full'} w-full relative cursor-pointer p-4 gap-2 bg-surface_variant flex flex-col md:text-base text-sm justify-start items-start rounded-xl`}>
      {variant === 'main' &&
        <div className="w-full md:h-40 h-20 object-cover bg-primary rounded-lg overflow-hidden" >
          <img src="/Homepage.gif" alt="" className="object-cover w-full h-full" />
        </div>
      }
      <div className="flex justify-start items-center gap-1">
        {variant === 'main' &&
          <div className="bg-primary w-2 h-2 rounded-full" />
        }
        <h3 className='text-onsurface_variant md:text-sm text-xs'>{title}</h3>
      </div>
      <p className='text-onsurface'>
        {subtitle}
      </p>
    </div>
  );
};

export const DiscoveryCard = memo(discoveryCardComponent);
