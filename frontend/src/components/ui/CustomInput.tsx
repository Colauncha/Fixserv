import React, { forwardRef, useState } from 'react';
import { IoEyeOffSharp, IoEyeSharp } from "react-icons/io5";

import { Input } from './input';


interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMsg?: string;
  type: string;
}

export const CustomImput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ errorMsg, type, ...props }, ref) => {

    const [showPassword, setShowPassword] = useState(false);

    const getType = type === 'password'
      ? showPassword
        ? 'text'
        : type
      : type

    const handleTogglePassword = () => {
      setShowPassword(!showPassword)
    }

    return (
      <>
        <div className='w-full h-full rounded-10 flex items-center border border-[#A56377] bg-white px-3'>
          <Input
            type={getType}
            ref={ref}
            {...props}
            className='w-full h-full rounded-10 bg-inherit border-none'
          />
          {type === 'password' &&
            <span onClick={handleTogglePassword} className='block cursor-pointer'>
              {showPassword ? <IoEyeSharp className='text-xl' /> : <IoEyeOffSharp className='text-xl' />}
            </span>
          }
        </div>
        {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
      </>
    )
  }
)