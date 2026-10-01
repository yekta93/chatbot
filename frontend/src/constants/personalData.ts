import { fileDisplays } from "@/types/personalData";

export const uploadedFilesDisplay: fileDisplays = [
  {
    title: "ID",
    key: "doc_id",
    type: "hidden",
    width: 0
  },
  {
    title: "نام فایل",
    key: "name",
    type: "text",
    width: 40
  },
  {
    title: "زمان بارگذاری",
    key: "creation_ts",
    type: "date",
    width: 15
  },
  {
    title: "وضعیت",
    key: "status",
    type: "status",
    width: 20
  },
  {
    title: "نوع فایل",
    key: "file_type",
    type: "type",
    width: 15
  },
]