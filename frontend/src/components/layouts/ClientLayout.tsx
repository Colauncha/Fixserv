import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../footer/Footer';
import ClientHeader from '../nav/ClientHeader';

const ClientLayout: React.FC = () => {
  const { pathname } = useLocation()
  return (
    <>
      <header className='pt-12'>
        <ClientHeader />
      </header>
      <main className='w-full 2xl:w-[1440px] mx-auto'>
        <Outlet />
      </main>
      {pathname !== '/welcome' && <Footer />}
    </>
  );
}

export default ClientLayout;
