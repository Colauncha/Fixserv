import React from 'react';
import { Button } from '../ui/button';
import banner from '@/assets/images/landing/banner.png';


interface Props {

}

const Banner: React.FC<Props> = (props) => {
  return (
    <section className='h-full px-6 xl:px-0 w-full xl:w-[1311px] mx-auto  relative mt-[70px] flex'>
      <div className='w-full h-full xl:h-[609px] flex justify-between flex-wrap xl:flex-nowrap gap-12'>
        <div className='w-full xl:w-[649px] h-full'>
          <h1 className='text-40 lg:text-64 font-bold text-pry lg:leading-[77px]'>
            <span className='text-[#110000C2]'>Digital</span> marketplace that connects users with <span className='text-[#110000C2]'>professional artisans</span>
          </h1>
          <p className='text-pry'>
            Provides a seamless, reliable marketplace <br />
            connecting customers with verified <br />
            professional gadget repairers.
          </p>
          <Button className='w-[196px] rounded-[20px] mt-10 text-xl h-[55px] bg-pry text-white'>
            Book a Repair
          </Button>
        </div>
        <div className='w-full xl:w-[541px] flex justify-center'>
          <img src={banner} alt="laptop repair image" className='block' />
        </div>
      </div>
    </section>
  );
}

export default Banner;
