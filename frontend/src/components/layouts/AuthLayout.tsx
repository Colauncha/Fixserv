import React from 'react';
import { Outlet } from 'react-router-dom';
import HeaderBox from '../nav/HeaderBox';

const AuthLayout: React.FC = () => {
  return (
    <>
      <HeaderBox />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AuthLayout;
