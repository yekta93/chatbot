import { MouseEventHandler } from "react";

type IModal = {
  actions: {
    title: string;
    variant:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | null
      | undefined;
    action: MouseEventHandler<HTMLButtonElement>;
  }[];
  title: string;
  subtitle: string;
};

const Modale = ({ actions, title, subtitle }: IModal) => {
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-20 w-screen h-screen bg-neutral-900/50 flex justify-center items-center"
    >
      <div className="w-fit h-fit shadow-xl rounded-2xl bg-white border border-neutral-100 py-4 px-8 flex flex-col gap-4 justify-start items-start">
        <h3 className="text-lg text-neutral-800 ">{title}</h3>
        <p className="text-sm text-neutral-700">{subtitle}</p>
        <div className="flex flex-row gap-2 justify-center items-center mt-8">
          {actions.map((button,index) => (
            // <Button key={index} size="sm" variant={button.variant} onClick={button.action}>
            // </Button>
            <p key={index}> {button.title} </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Modale;
