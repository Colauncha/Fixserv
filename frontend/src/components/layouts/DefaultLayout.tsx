import React from 'react';
import { Outlet } from 'react-router-dom';
import HeaderBox from '../nav/HeaderBox';
import Footer from '../footer/Footer';

const DefaultLayout: React.FC = () => {
  return (
    <>
      <HeaderBox />
      <main className='w-full xl:w-[1280px] mx-auto'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default DefaultLayout;
