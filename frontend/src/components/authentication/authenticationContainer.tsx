import { AuthContainerCard } from './common/containerCard/containerCard'
import { MdFilledButton, MdTextButton } from '@/material'
import { AuthContainerHeader } from './common/containerHeader/containerHeader'
import { useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import useAuth from '@/context/authenticationContext'
import { toast } from 'react-toastify'
import useUsers from '@/context/usersContext'
import { TextField } from './common/form/textInput'

const AuthenticationContainer = () => {
  const [authorizationStep, setAuthorizationStep] = useState<'phone' | 'code' | 'authenticated'>('phone')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [fName, setFName] = useState<string>('')
  const [lName, setLName] = useState<string>('')
  const [sendValidationInterval, setSendValidationInterval] = useState<number>(0)
  const [validationCode, setValidationCode] = useState<string>('')
  const { getToken, sendValidationCode } = useAuth()
  const navigate = useNavigate()
  const { signUpUser } = useUsers()
  const { method } = useParams()

  const setValidationInterval = useCallback(
    () => {
      sendValidationCode(phoneNumber).then((res) => {
        if (res) {
          toast.success('کد ورود با موفقیت ارسال شد.', {
            rtl: true,
            position: 'bottom-right'
          });

          setAuthorizationStep('code')
          setSendValidationInterval(120)
          const interval = setInterval(() => {
            setSendValidationInterval((prevCounter) => {
              if (prevCounter <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prevCounter - 1;
            });
          }, 1000);

          return () => clearInterval(interval);
        }
      })
    }, [setSendValidationInterval, phoneNumber])


  useEffect(() => {
    setValidationInterval()
    setAuthorizationStep('phone')
  }, [method]);

  const handleNext = async (step: 'phone' | 'code' | 'authenticated') => {
    switch (step) {
      case 'phone':
        if (method === 'signUp') {
          signUpUser({
            phoneNum: phoneNumber,
            fname: fName,
            lname: lName
          }).then((res) => res && setValidationInterval())
        } else {
          setValidationInterval()
        }
        // method === 'signUp' && setAuthorizationStep('name')
        break;
      // case 'name':
      //   signUpUser({
      //     phoneNum: phoneNumber,
      //     fname: fName,
      //     lname: lName
      //   }).then((res) => res && setValidationInterval())
      //   break;
      case 'code':
        getToken({
          username: phoneNumber,
          password: validationCode
        }).then((res) => res && navigate('/'))
        break;
      default:
        setAuthorizationStep('phone')
        break;
    }
  }

  const handleStepsInput = () => {
    switch (authorizationStep) {
      case 'phone':
        return (
          <div className='flex flex-col gap-4 w-full justify-center items-start mt-24'>
            {
              method !== 'signUp' &&
              <>
                <TextField value={phoneNumber} onChange={(e) => setPhoneNumber(e)} onSubmit={() => handleNext(authorizationStep)} id='phoneNumber' label='شماره تلفن' placeholder='شماره تلفن' />
                <p className='text-onsurface_variant w-full'>حساب کاربری ندارید؟ روی دکمه‌ی ایجاد حساب کلیک کنید.</p>
              </>
            }
            {
              method === 'signUp' &&
              <>
                <TextField value={phoneNumber} onChange={(e) => setPhoneNumber(e)} id='phoneNumber' label='شماره تلفن' placeholder='شماره تلفن' />
                <div className='flex flex-row gap-4 w-full justify-center items-start'>
                  <TextField value={fName} onChange={(e) => setFName(e)} id='fName' label='نام' placeholder='نام' />
                  <TextField value={lName} onChange={(e) => setLName(e)} onSubmit={() => handleNext(authorizationStep)} id='lName' label='نام خانوادگی' placeholder='نام خانوادگی' />
                </div>
              </>
            }
          </div>
        )
      case 'code':
        return (
          <div className='flex flex-col gap-2 w-full justify-center items-start mt-24'>
            <TextField value={validationCode} onChange={(e) => setValidationCode(e)} onSubmit={() => handleNext(authorizationStep)} id='validationCode' label='کد تایید' placeholder='کد تایید' />
            <div className='w-full flex justify-between items-center'>
              <MdFilledButton onClick={setValidationInterval} disabled={!!sendValidationInterval}>
                ارسال مجدد کد
              </MdFilledButton>
              <p className='opacity-50'>{!!sendValidationInterval && `${Math.floor(sendValidationInterval / 60)}:${String(sendValidationInterval % 60).padStart(2, '0')}`}</p>
            </div>
          </div>
        )
      default:
        return (<p className='text-onsurface_variant w-full'>مشکلی رخ داده است. لطفا باری دیگر تلاش کنید.</p>)
    }
  }

  return (
    <AuthContainerCard>
      {
        method === 'signUp' ?
          <AuthContainerHeader title='ایجاد حساب دانایار' subtitle='دانایار باسابقه‌ترین و باهوش‌ترین مشاور سازمانی.' />
          :
          <AuthContainerHeader title='ورود به حساب' subtitle='دانایار باسابقه‌ترین و باهوش‌ترین مشاور سازمانی.' />
      }
      <div className='w-2/4 flex flex-col justify-start items-start h-full'>
        {handleStepsInput()}
        <div className='flex flex-row-reverse gap-2 justify-start items-center mt-10 w-full'>
          <MdFilledButton type='submit' onClick={() => handleNext(authorizationStep)}>ادامه</MdFilledButton>
          {
            method !== 'signUp' && <MdTextButton onClick={() => navigate('/auth/signUp')}>ایجاد حساب</MdTextButton>
          }
        </div>
      </div>
    </AuthContainerCard>
  )
}

export default AuthenticationContainer