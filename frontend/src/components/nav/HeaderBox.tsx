import React from 'react';
import logo from '@/assets/images/logo.svg';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { navLinks } from '@/constants/links';
import MobileNav from './MobileNav';


interface Props {

}

const HeaderBox: React.FC<Props> = (props) => {

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/welcome');
  };

  return (
    <div className='h-[78px] px-6 xl:px-0 w-full xl:w-[1309px] 2xl:w-[1400px] mx-auto sticky top-0 z-50 bg-white'>
      <nav className='w-full h-full flex items-center justify-between'>
        <NavLink to='/' className='block'>
          <img src={logo} alt="company logo" className='block h-[65px]' />
        </NavLink>

        <div className='hidden lg:flex gap-x-12 text-pry'>
          {navLinks.map(item => (
            <NavLink to={item.path} key={item.id} className='text-xl'>
              {item.routeName}
            </NavLink>
          ))}
        </div>
        <div className='hidden lg:flex items-center gap-x-10'>

          {pathname === '/welcome' ?
            (
              <Button onClick={() => navigate('/auth/login')} className='w-[167px] h-11 rounded-10 text-xl bg-pry text-white'>
                Log in
              </Button>
            )
            : (<Button onClick={handleNavigation} className='w-[167px] h-11 rounded-10 text-xl bg-pry text-white'>
              Sign up
            </Button>)}
        </div>
        <div className='block lg:hidden'>
          <MobileNav />
        </div>
      </nav>
    </div>
  );
}

export default HeaderBox;
