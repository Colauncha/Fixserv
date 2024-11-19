import React from 'react';
import bannerImg from '@/assets/images/banner.png';
import { Input } from '../ui/input';
import { Button } from '../ui/button';


interface Props {

}

const Banner: React.FC<Props> = (props) => {
  return (
    <section className='h-full lg:h-[550px] w-full xl:w-[1106px] mx-auto mt-10 relative'>
      <img src={bannerImg} alt="" className='w-full h-full' />
      <div className='w-[643px] h-full absolute top-0 right-0 bg-[#F99898]/50 py-[88px] px-[57px]'>
        <div className='text-white'>
          <h3 className='text-5xl'>Fixserv </h3>
          <p className='text-3xl leading-[54px] pt-4'>
            Provides a seamless, reliable marketplace
            connecting customers with verified
            professional gadget repairers.
          </p>
          <div className='w-[510px] h-[70px] mt-16 shadow-md rounded-10 bg-pry flex items-center px-3'>
            <Input placeholder='Enter working Email' className='border-none w-full h-full text-white placeholder:text-white text-2xl bg-inherit' />
            <Button className='w-[180px] h-[50px] text-xl text-black rounded-10 bg-white'>
              Book a service
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Banner;
