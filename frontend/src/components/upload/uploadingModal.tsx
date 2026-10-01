import useSettings from "@/context/settingsContext";
import useUploading from "@/context/uploadingContext";
import { useDidMountEffect } from "@/hooks/use_did_mount_effect";
import { useOutsideClick } from "@/hooks/use_outside_click";
import { cn } from "@/lib/utils";
import { MdFilledButton, MdIcon, MdIconButton } from "@/material";
import { useCallback, useState } from "react";
import { useCookies } from "react-cookie";
// import { useNavigate } from "react-router-dom";

const UploadingModal = () => {
  const { modalState, setModalState, uploadFile, setUploadingFilesHistory } = useUploading();
  const [files, setFiles] = useState<File[]>([]);
  const { currentTheme } = useSettings();
  const [cookies] = useCookies();
  // const navigate = useNavigate();
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length) {
      setFiles([droppedFiles[0]]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length) {
      setFiles([selectedFiles[0]]);
    }
  };

  useDidMountEffect(() => {
    if (files.length) {
      handleFileUpload(files[0]);
    }
  }, [files]);

  const ref = useOutsideClick(() => {
    if (modalState) setModalState(false);
  });

  const handleFileUpload = useCallback(
    (file: File) => {
      uploadFile(file, file.name).then((res) => {
        if (res) {
          setUploadingFilesHistory(20);
          setModalState(false);
          // navigate('/personal-data')
        }
      });
    },
    [uploadFile, setModalState, setUploadingFilesHistory]
  );

  return (
    <div
      dir="rtl"
      className={cn(
        "layout transition-all duration-200 fixed inset-0 z-50 flex justify-center items-center",
        cookies.theme ?? currentTheme,
        modalState ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-0 opacity-0 pointer-events-none'
      )}
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        ref={ref}
        className="z-30 w-1/2 h-3/5 relative bg-surface_bright rounded-2xl flex flex-col p-6 gap-3"
      >
        <div className="flex justify-between items-center w-full">
          <h2 className="text-lg text-onsurface vazir-bold">بارگذاری فایل</h2>
          <MdIconButton onClick={() => setModalState(false)}>
            <MdIcon className="material-icons">close</MdIcon>
          </MdIconButton>
        </div>
        <label
          htmlFor="uploadFile1"
          className="flex flex-col items-center justify-center w-full h-full border border-onsurface_variant border-dashed rounded-lg cursor-pointer gap-8"
        >
          <MdIconButton className="scale-[200%] pointer-events-none">
            <MdIcon className="material-icons text-primary">upload</MdIcon>
          </MdIconButton>
          <input
            onChange={handleFileInputChange}
            type="file"
            id="uploadFile1"
            className="hidden"
            accept=".pdf"
            multiple={false}
          />
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-onsurface vazir-bold text-lg">فایل خود را اینجا بکشید.</h3>
            <div className="flex items-center justify-center gap-2 text-onsurface_variant">
              <div className="h-1 w-2 border-t border-onsurface_variant" />
              <p>یا</p>
              <div className="h-1 w-2 border-t border-onsurface_variant" />
            </div>
            <MdFilledButton className="pointer-events-none">
              بارگذاری فایل از روی سیستم
            </MdFilledButton>
          </div>
        </label>
      </div>
    </div>
  );
};

export default UploadingModal;