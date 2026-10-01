import { IStep } from "@chainlit/react-client";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const seededRandom = (seed: number) => {
  const m = 2 ** 35 - 31;
  const a = 185852;
  let s = seed % m;

  return (s = (s * a) % m) / m;
}

export type formatMetadataTypes = 'string' | 'currency' | 'date' | 'float' | 'int'
export const handleFormatMetadata = (content: string, type?: formatMetadataTypes) => {
  switch (type) {
    case 'currency': {
      const formatter = new Intl.NumberFormat('default', {
        style: 'currency',
        currency: 'IRR',
      });

      return `${formatter.format(parseInt(content)).replace('IRR', '')} ریال`
    }
    case 'date':

      return new Date(content).toLocaleDateString('fa-IR')

    default:
      return content.toString()
  }
}

export const isNullOrEmpty = (value: unknown) => {
  return (value === undefined || value === 'undefined' || value === null || value === "");
}


export const flattenMessages = (
  messages: IStep[], 
  condition: (node: IStep) => boolean
): IStep[] => {
  return messages.reduce((acc: IStep[], node) => {
    if (condition(node)) {
      acc.push(node);
    }
    if (node.steps?.length) {
      acc.push(...flattenMessages(node.steps, condition));
    }

    return acc;
  }, []);
}