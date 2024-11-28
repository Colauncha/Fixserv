import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"
import { NavLink } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { z } from "zod"
import { Button } from '@/components/ui/button';
import { CustomImput } from '@/components/ui/CustomInput';
import goog from '@/assets/images/auth/google.svg';


const formSchema = z.object({
  lastName: z.string().min(3, {
    message: 'last name must be at least 3 characters'
  }),
  firstName: z.string().min(3, {
    message: 'first name must be at least 3 characters'
  }),
  email: z.string().email(),
  password: z.string().min(8, {
    message: 'password must be at least 8 character(s)'
  }),
  confirm_password: z.string().min(8, {
    message: 'password must be at least 8 character(s)'
  }),
  fix: z.string().min(3, {
    message: 'item description must be at least 3 characters'
  }),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormField = z.infer<typeof formSchema>

const GuestSignUpPage: React.FC = () => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormField>({
    defaultValues: {
      lastName: '',
    },
    resolver: zodResolver(formSchema)
  });

  const onSubmit: SubmitHandler<FormField> = async (data) => {
    console.log(data)
  }

  return (
    <section>
      <h2 className='text-black1 text-40'>Guest Registration</h2>

      <form onSubmit={handleSubmit(onSubmit)} className='w-[435px] pt-16'>
        <div className='mb-4 gap-3 grid grid-cols-2'>
          <CustomImput
            {...register('lastName')}
            type='text'
            errorMsg={errors.lastName?.message}
            label='Last Name'
            inputId='lname'
          />
          <CustomImput
            {...register('firstName')}
            type='text'
            errorMsg={errors.firstName?.message}
            label='First Name'
            inputId='fname'
          />
        </div>
        <div className='mb-4'>
          <CustomImput
            {...register('email')}
            type='email'
            errorMsg={errors.email?.message}
            label='Email'
            inputId='email'
          />
        </div>
        <div className='mb-4'>
          <CustomImput
            {...register('password')}
            type='password'
            errorMsg={errors.password?.message}
            label='Password'
            inputId='pwd'
          />
        </div>
        <div className='mb-4'>
          <CustomImput
            {...register('confirm_password')}
            type='password'
            errorMsg={errors.confirm_password?.message}
            label='Confirm Password'
            inputId='cpwd'
          />
        </div>
        <div className='mb-4'>
          <CustomImput
            {...register('fix')}
            type='text'
            errorMsg={errors.fix?.message}
            label='What do you want to fix?'
            inputId='fix'
          />
        </div>
        <div className='w-full flex items-center justify-between mt-12'>
          <Button className='w-[333px] h-[52px] rounded-10 bg-pry-light text-[#ECF1FC] text-xl'>
            {isSubmitting ? <Loader size={24} /> : ' Sign up'}
          </Button>
          <Button className='w-[76px] h-[52px] rounded-10 bg-white shadow-md'>
            <img src={goog} alt="google icon" />
          </Button>
        </div>
        <p className='text-center pt-4'>Already have an account? <NavLink to='#' className='font-semibold'>Login</NavLink></p>
      </form>
    </section>
  );
}

export default GuestSignUpPage;
