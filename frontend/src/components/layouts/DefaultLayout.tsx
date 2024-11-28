import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import HeaderBox from '../nav/HeaderBox';
import Footer from '../footer/Footer';

const DefaultLayout: React.FC = () => {
  const { pathname } = useLocation()
  return (
    <>
      <header className='pt-[34px]'>
        <HeaderBox />
      </header>
      <main className='w-full 2xl:w-[1440px] mx-auto'>
        <Outlet />
      </main>
      {pathname !== '/welcome' && <Footer />}
    </>
  );
}

export default DefaultLayout;
