import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '@/assets/images/logo-white.svg';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import fb from '@/assets/images/socials/fb.svg';
import x from '@/assets/images/socials/twitter.svg';
import linkedin from '@/assets/images/socials/linkedin.svg';
import telephone from '@/assets/images/socials/telephone.svg'
import mail from '@/assets/images/socials/mail.svg';
import insta from '@/assets/images/socials/insta.svg';
interface Props {

}

const Footer: React.FC<Props> = (props) => {
  return (
    <footer className='w-full xl:w-[1400px] py-[70px] px-[60px] mx-auto bg-pry h-[560px] mt-10 flex gap-14'>
      <div className='w-[500px]'>
        <NavLink to='/'>
          <img src={logo} alt="" />
        </NavLink>
        <p className='text-white text-2xl pt-[30px]'>
          Provides a seamless, reliable marketplace
          connecting customers with verified
          professional gadget repairers.
        </p>
        <div className='pt-10'>
          <a href="tel:+34987654321" className='flex items-center gap-x-5 text-white'>
            <img src={telephone} alt="" className='block size-8' />
            <p>+234 987654321</p>
          </a>
          <a href="mailto:fixserv@gmail.com" className='flex items-center pt-3 text-white gap-x-5'>
            <img src={mail} alt="" className='block size-8' />
            <p>fixserv@gmail.com</p>
          </a>
          <p className='text-[#ECF1FC] text-2xl pt-4'>
            Follow us
          </p>
          <div className='h-[35px] w-[162px] pt-5 rounded-10 flex gap-3 items-center justify-around'>
            <a href="http://#" className='size-[31px] block'>
              <img src={fb} alt="" />
            </a>
            <a href="http://#" className='size-[31px] block'>
              <img src={insta} alt="" />
            </a>
            <a href="http://#" className='size-[31px] block'>
              <img src={linkedin} alt="" />
            </a>
            <a href="http://#" className='size-[29px] block'>
              <img src={x} alt="" />
            </a>
          </div>
        </div>
      </div>

      <div className='space-y-8'>
        <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
          Home
        </NavLink>
        <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
          About us
        </NavLink>
        <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
          Contact us
        </NavLink>
        <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
          Help and Support
        </NavLink>
      </div>

      <div className='h-full flex flex-col justify-between'>
        <div className='space-y-8'>
          <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
            Community
          </NavLink>
          <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
            Community Hub
          </NavLink>
          <NavLink to='#' className='block text-xl text-[#ECF1FC]'>
            Events
          </NavLink>
        </div>

        <div className='w-[480px] h-[60px] mt-16 rounded-10 bg-white flex items-center px-2'>
          <Input placeholder='Enter working Email' className='border-none w-full h-full text-pry placeholder:text-pry text-2xl bg-inherit' />
          <Button className='w-[180px] h-[50px] text-xl text-white rounded-10 bg-pry'>
            Book a service
          </Button>
        </div>
      </div>
      {/* <div className='w-[510px] h-[70px] mt-16 rounded-10 bg-white flex items-center px-3'>
        <Input placeholder='Enter working Email' className='border-none w-full h-full text-pry placeholder:text-pry text-2xl bg-inherit' />
        <Button className='w-[180px] h-[50px] text-xl text-white rounded-10 bg-pry'>
          Book a service
        </Button>
      </div> */}
      {/* <div className='text-white'>
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
      </div> */}
    </footer>
  );
}

export default Footer;
