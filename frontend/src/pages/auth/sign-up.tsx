import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import image1 from '@/assets/images/auth/register.png';
import { Button } from '@/components/ui/button';
import { CustomImput } from '@/components/ui/CustomInput';
import goog from '@/assets/images/auth/google.svg';
import { NavLink } from 'react-router-dom';


const formSchema = z.object({
  fullName: z.string().min(3, {
    message: 'name must be at least 3 characters'
  }),
  email: z.string().email(),
  password: z.string().min(8, {
    message: 'password must be at least 8 character(s)'
  }),
  confirm_password: z.string().min(8, {
    message: 'password must be at least 8 character(s)'
  })
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormField = z.infer<typeof formSchema>

const SignupPage: React.FC = () => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormField>({
    defaultValues: {
      fullName: '',
    },
    resolver: zodResolver(formSchema)
  });

  const onSubmit: SubmitHandler<FormField> = async (data) => {
    console.log(data)
  }

  return (
    <section className='w-full xl:w-[1280px] mx-auto h-full'>
      <div className='w-full flex justify-between'>
        <form onSubmit={handleSubmit(onSubmit)} className='pt-[130px] w-[454px]'>
          <div className='pb-16'>
            <h3 className='text-2xl'>Get Started</h3>
            <p className='pt-2'>Welcome to Fixserv - Let’s create your account </p>
          </div>
          <div className='mb-9 h-[52px] w-[454px]'>
            <CustomImput
              placeholder='Full name'
              {...register('fullName')}
              type='text'
              errorMsg={errors.fullName?.message}
            />
          </div>
          <div className='mb-9 h-[52px] w-[454px]'>
            <CustomImput
              placeholder='Email'
              {...register('email')}
              type='email'
              errorMsg={errors.email?.message}
            />
          </div>
          <div className='mb-9 h-[52px] w-[454px]'>
            <CustomImput
              placeholder='Password'
              {...register('password')}
              type='password'
              errorMsg={errors.password?.message}
            />
          </div>
          <div className='mb-9 h-[52px] w-[454px]'>
            <CustomImput
              placeholder='Confirm password'
              {...register('confirm_password')}
              type='password'
              errorMsg={errors.confirm_password?.message}
            />
          </div>
          <div className='w-full flex items-center justify-between mt-20'>
            <Button className='w-[351px] h-[52px] rounded-10 bg-pry text-white'>
              Sign up
            </Button>
            <Button className='w-[76px] h-[52px] rounded-10 bg-white shadow-md'>
              <img src={goog} alt="google icon" />
            </Button>
          </div>
          <p className='text-center pt-4'>Already have an account? <NavLink to='#' className='font-semibold'>Login</NavLink></p>
        </form>
        <div className=''>
          <h2 className='text-[60px] pb-20'>Registration</h2>
          <div className='bg-[#fccccc] rounded-tl-[20px]'>
            <img src={image1} alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignupPage;
