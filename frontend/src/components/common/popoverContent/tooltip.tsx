import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { ReactNode } from "react";

type ITooltip = {
  title: string;
  helper?: string;
  children: ReactNode;
  variant?: "default" | "down" | "right" | "left" | null | undefined;
};

const tooltipVariants = cva(
  "z-50 absolute group-hover:opacity-100 opacity-0 whitespace-nowrap transition-all ease-in-out delay-200 text-center rounded-lg py-1 px-2 text-onsurface_dim flex flex-row-reverse gap-1 justify-center items-center text-[11px] leading-3",
  {
    variants: {
      variant: {
        default: "-translate-y-[1.75rem] bg-surface_bright menu__popover-shadow",
        down: "translate-y-[1.75rem] bg-surface_bright menu__popover-shadow",
        right: "translate-x-[2.75rem] bg-surface_bright menu__popover-shadow",
        left: "-translate-x-[2.75rem] bg-surface_bright menu__popover-shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Tooltip = ({ variant, title, helper, children }: ITooltip) => {
  return (
    <div className="flex flex-col justify-center items-center gap-0 group relative">
      <div className={cn(tooltipVariants({ variant }))}>
        <p>{title}</p>
        {helper && <p>{helper}</p>}
      </div>
      {children}
    </div>
  );
};

export default Tooltip;
