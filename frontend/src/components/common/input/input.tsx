import * as React from "react";
import { cn } from "@/lib/utils";
export interface InputProps
  extends React.InputHTMLAttributes<HTMLTextAreaElement> { }

const Input = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, ...props}, ref) => {
    
    return (
      <div className="w-full h-full max-w-full max-h-[25vh] grid text-sm">
        <textarea
          dir="rtl"
          className={cn(
            "w-full resize-none max-w-full min-h-[2vh] max-h-[25vh] bg-transparent overflow-y-auto appearance-none placeholder:text-onsurface_variant text-onsurface text-base rounded-full px-3.5 py-2.5 outline-none focus:bg-transparent",
            className
          )}
          rows={1}
          ref={ref}
          {...props}
        />
      </div>

    );
  }
);
Input.displayName = "Input";

export { Input };
