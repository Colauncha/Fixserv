import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import image1 from '@/assets/images/auth/workers.png';
import image2 from '@/assets/images/auth/gadget.png';


const AuthLayout: React.FC = () => {
  const { pathname } = useLocation()
  console.log(pathname)
  return (
    <>
      <main className='w-full 2xl:w-[1440px] mx-auto flex gap-24 h-full'>
        <aside className="w-full xl:w-[605px] h-[1024px] bg-[url('@/assets/images/auth/auth-bg.png')] bg-no-repeat bg-top bg-contain bg-pry-light">
          {pathname === '/auth/guest-sign-up'
            ? (
              <div className='w-full'>
                <img src={image2} alt="" />
              </div>
            )
            : pathname === '/auth/sign-up'
              ? (
                <div>
                  <img src={image1} alt="" />
                </div>
              )
              : (
                <div className='w-full pl-[65px] h-full py-[200px]'>
                  <h1 className='text-black1 tracking-tight leading-[116px] text-[96px] font-medium'>
                    Welcome Back!
                  </h1>
                  <p className='text-3xl text-black1 pt-10'>
                    Get connected with professional <br /> artisans
                  </p>
                </div>
              )
          }

        </aside>
        <section className='flex-1 pt-20'>
          <Outlet />
        </section>
      </main>
    </>
  );
}

export default AuthLayout;
