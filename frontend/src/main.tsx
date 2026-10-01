import ReactDOM from "react-dom/client";
import { RecoilRoot } from "recoil";
import { ChainlitAPI, ChainlitContext } from "@chainlit/react-client";
import { API_ROUTE } from "./constants/api.ts";
import AppWrapper from "./appWrapper.tsx";
import { PagesProvider } from "./context/pageContext.tsx";
import { SettingsProvider } from "./context/settingsContext.tsx";
import { GroupDataProvider } from "./context/groupDataContext.tsx";
import { MessagingProvider } from "./context/messagingContext.tsx";
import { AuthProvider } from "./context/authenticationContext.tsx";
import { UsersProvider } from "./context/usersContext.tsx";
import { UploadingProvider } from "./context/uploadingContext.tsx";
import UploadingModal from "./components/upload/uploadingModal.tsx";
import { ToastContainer } from "react-toastify";
import Settings from "./pages/settings.tsx";
import 'react-toastify/dist/ReactToastify.css';
import './styles/styleThemes.css'
import "./index.css";

const CHAINLIT_SERVER = `${API_ROUTE}/chainlit`;
const apiClient = new ChainlitAPI(CHAINLIT_SERVER, "webapp");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ChainlitContext.Provider value={apiClient}>
    <RecoilRoot>
      <PagesProvider>
        <SettingsProvider>
          <GroupDataProvider>
            <MessagingProvider>
              <AuthProvider>
                <UsersProvider>
                  <UploadingProvider>
                    <AppWrapper />
                    <UploadingModal />
                    <ToastContainer />
                    <Settings />
                  </UploadingProvider>
                </UsersProvider>
              </AuthProvider>
            </MessagingProvider>
          </GroupDataProvider>
        </SettingsProvider>
      </PagesProvider>
    </RecoilRoot>
  </ChainlitContext.Provider>
);
