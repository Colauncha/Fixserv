import React from 'react'
import { useNavigate } from 'react-router-dom';
import image1 from '@/assets/images/man-working.png';
import { Button } from '@/components/ui/button';



export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/auth/guest-sign-up');
  };
  return (
    <section className='w-full xl:w-[1440px] pt-14 flex gap-20 mx-auto'>
      <div>
        <img src={image1} alt="" />
      </div>
      <div className='pt-16'>
        <h1 className='font-bold text-[120px] leading-[154px]'>
          Welcome <span className='text-pry'>to </span> <br />
          Fixserv
        </h1>
        <div>
          <p className='py-5 text-black1 text-xl'>Get Started</p>
          <Button className='h-[49px] w-[210px] rounded-10 text-3xl text-[#ECF1FC] bg-pry-light'>
            Artisan
          </Button> <br />
          <Button className='h-[49px] my-7 w-[210px] rounded-10 text-3xl text-[#ECF1FC] bg-pry-light'>
            Guest
          </Button>
          <p className='text-black1 text-xl'>Welcome to Fixserv - Let’s create your account </p>
        </div>
      </div>
    </section>
  )
}
