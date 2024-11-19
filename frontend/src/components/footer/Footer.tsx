import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '@/assets/images/logo-white.svg';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import fb from '@/assets/images/socials/fb.svg';
import x from '@/assets/images/socials/twitter.svg';
import linkedin from '@/assets/images/socials/linkedin.svg';
import telegram from '@/assets/images/socials/telegram.svg';

interface Props {

}

const Footer: React.FC<Props> = (props) => {
  return (
    <footer className='w-full xl:w-[1400px] py-[34px] px-[60px] mx-auto bg-pry h-[269px] mt-5 flex items-center justify-between'>
      <div>
        <NavLink to='/'>
          <img src={logo} alt="" />
        </NavLink>
        <p className='text-white pt-5'>
          Provides a seamless, reliable marketplace <br />
          connecting customers with verified <br />
          professional gadget repairers.
        </p>
      </div>
      <div className='w-[510px] h-[70px] mt-16 rounded-10 bg-white flex items-center px-3'>
        <Input placeholder='Enter working Email' className='border-none w-full h-full text-pry placeholder:text-pry text-2xl bg-inherit' />
        <Button className='w-[180px] h-[50px] text-xl text-white rounded-10 bg-pry'>
          Book a service
        </Button>
      </div>
      <div className='text-white'>
        <div className='flex gap-2'>
          <NavLink to='#'>About us</NavLink>
          <NavLink to='#'>Testimonial</NavLink>
          <NavLink to='#'>Blog</NavLink>
        </div>
        <p className='mt-[50px] pb-1'>Contact us:</p>
        <div className='bg-white h-[35px] w-[191px] rounded-10 flex items-center justify-around px-7'>
          <a href="http://#">
            <img src={fb} alt="" />
          </a>
          <a href="http://#">
            <img src={x} alt="" />
          </a>
          <a href="http://#">
            <img src={linkedin} alt="" />
          </a>
          <a href="http://#">
            <img src={telegram} alt="" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
