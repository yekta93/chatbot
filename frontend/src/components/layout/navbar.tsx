import usePages from "@/context/pageContext";
import { MdIcon, MdIconButton, MdFilledIconButton } from "@/material";
import { useChatInteract } from "@chainlit/react-client";
import { useState } from "react";
import { Link } from "react-router-dom";
import UploadsContainer from "../upload/uploadsContainer";
import { UserMenuContainer } from "../authentication/userMenuContainer";
import useUploading from "@/context/uploadingContext";

export const Navbar = () => {
  const [notificationsIsOpen, setNotificationsIsOpen] = useState<boolean>(false)
  const [userMenuIsOpen, setUserMenuIsOpen] = useState<boolean>(false)
  const { menuOpen, setMenuOpen } = usePages()
  const { uploadingFiles } = useUploading()
  const { clear } = useChatInteract()

  return (
    <header className="w-full h-fit px-4 py-2 flex justify-center items-center">
      <nav className="w-full h-full flex flex-row justify-between items-center z-10">
        <div className="flex flex-row justify-start items-center gap-4">
          <MdFilledIconButton onClick={() => setUserMenuIsOpen((prev) => !prev)} className="md:flex hidden">
            <MdIcon className="material-icons">person</MdIcon>
          </MdFilledIconButton>
          <UserMenuContainer isOpen={userMenuIsOpen} outsideClick={() => setUserMenuIsOpen((prev) => !prev)} />
          <MdIconButton className="md:flex hidden" onClick={() => setNotificationsIsOpen((prev) => !prev)}>
            <MdIcon className="material-icons">
              notifications
            </MdIcon>
            {
              uploadingFiles.some((file) => file.state === 'processing') &&
                <div className="flex justify-center items-center w-2 h-2 bg-primary rounded-full absolute right-1/4"/>
            }
          </MdIconButton>
          <UploadsContainer outsideClick={() => setNotificationsIsOpen(false)} isOpen={notificationsIsOpen} />
        </div>
        <div className="w-full flex md:justify-end justify-between items-center gap-4 pr-0">
          <Link onClick={clear} to='/' className="text-2xl vazir-light text-onbackground flex md:flex-row-reverse flex-row gap-4 items-center">
            <img src="/favicon.ico" alt="Danayar-logo" className="w-10 h-10 saturate-0 brightness-0" />
            دانایار
          </Link>
          <MdIconButton onClick={() => setMenuOpen(!menuOpen)}>
            <MdIcon className="material-icons">menu</MdIcon>
          </MdIconButton>
        </div>
      </nav>
    </header>
  );
};
