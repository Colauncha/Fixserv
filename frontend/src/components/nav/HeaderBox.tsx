import React from 'react';
import logo from '@/assets/images/logo.svg';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';


interface Props {

}

const HeaderBox: React.FC<Props> = (props) => {
  const { pathname } = useLocation()
  console.log(pathname)
  return (
    <header className='h-[110px] w-full xl:w-1280 mx-auto sticky top-0 z-50 bg-white'>
      <nav className='w-full h-full flex items-center justify-between'>
        <NavLink to='/' className='block'>
          <img src={logo} alt="company logo" className='block h-[65px]' />
        </NavLink>

        <div className='flex items-center gap-x-[76px]'>
          <NavLink to='#'>
            About Us
          </NavLink>
          {!pathname.includes('/auth') && <Button className='bg-pry text-white w-[108px] h-9'>
            <NavLink to='#' className='w-full h-full'>
              Login
            </NavLink>
          </Button>}
        </div>
      </nav>
    </header>
  );
}

export default HeaderBox;
