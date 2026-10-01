import { cn } from "@/lib/utils";
import { memo } from "react"

interface IThemeCardProps {
  theme: string;
  title: string;
  isSelected: boolean;
  onClick: (theme: string) => void;
}

const themeCardComponent = ({
  theme,
  title,
  onClick,
  isSelected,
}: IThemeCardProps) => {
  return (
    <div onClick={() => onClick(theme)} className={cn(
      "w-full p-4 flex flex-row justify-between items-center rounded-lg cursor-pointer",
      isSelected ? "bg-surface_variant" : "hover:bg-surface_container"
    )}>
      <h4 className='text-onbackground text-base vazir-bold'>{title}</h4>
      <div className={cn(
        "w-48 h-16 bg-surface border-4 border-primary_fixed_dim rounded-lg flex flex-row p-1 justify-center items-center",
        `layout ${theme}`,
        `theme-${theme}`,
      )}>
        <div className={cn(
          "w-full h-full rounded-lg shadow-sm bg-primary ",
          `theme-${theme}`,
          `layout ${theme}`,
          )} />
        <div className={cn(
          "w-full h-full rounded-lg shadow-sm -mr-4 bg-secondary ",
          `theme-${theme}`,
          `layout ${theme}`,
          )} />
        <div className={cn(
          "w-full h-full rounded-lg shadow-sm -mr-4 bg-tertiary_container ",
          `theme-${theme}`,
          `layout ${theme}`,
          )} />
        <div className={cn(
          "w-full h-full rounded-lg shadow-sm -mr-4 bg-surface ",
          `theme-${theme}`,
          `layout ${theme}`,
          )} />
      </div>
    </div>
  )
}

export const ThemeCard = memo(themeCardComponent)