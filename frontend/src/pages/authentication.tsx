import AuthenticationContainer from '@/components/authentication/authenticationContainer'
import useSettings from '@/context/settingsContext';
import { useCookies } from 'react-cookie';

const Authentication = () => {
  const { currentTheme } = useSettings()
  const [cookies] = useCookies();

  return (
    <section className={`layout ${cookies.theme ?? currentTheme} w-full h-full z-50 fixed inset-0 bg-surface_variant flex flex-col justify-center items-center gap-4 p-4`}>
      <AuthenticationContainer/>
    </section >
    )
}

export default Authentication