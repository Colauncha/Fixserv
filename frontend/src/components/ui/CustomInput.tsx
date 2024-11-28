import React, { forwardRef, useState } from 'react';
import { IoEyeOffSharp, IoEyeSharp } from "react-icons/io5";
import { Input } from './input';
import { Label } from './label';


interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMsg?: string;
  type: string;
  label: string;
  inputId: string;
}

export const CustomImput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ errorMsg, label, type, inputId, ...props }, ref) => {

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
      <div>
        <Label htmlFor={inputId} className='block mb-2'>
          {label}
        </Label>
        <div className='w-full h-[52px] rounded-10 flex items-center border border-[#94B0F8] bg-white px-3'>
          <Input
            type={getType}
            ref={ref}
            {...props}
            id={inputId}
            className='w-full h-full rounded-10 bg-inherit border-none'
          />
          {type === 'password' &&
            <span onClick={handleTogglePassword} className='block cursor-pointer'>
              {showPassword ? <IoEyeSharp className='text-xl text-[#94B0F8]' /> : <IoEyeOffSharp className='text-xl text-[#94B0F8]' />}
            </span>
          }
        </div>
        {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
      </div>
    )
  }
)