import { Menu, Search } from 'lucide-react';
import React from 'react';
import { Input } from '../ui/input';

interface Props {

}

const ClientHeader: React.FC<Props> = (props) => {
  return (
    <nav className='w-full xl:w-[1309px] mx-auto 2xl:w-[1400px] flex justify-between items-center'>
      <div className='flex gap-16 items-center'>
        <Menu size={28} className='text-pry' />
        <h3 className='text-4xl leading-[44px] w-[150px]'>
          Welcome
          to Fixserv
        </h3>
      </div>

      <div className='w-full lg:w-[800px] flex items-center bg-[#94B0F8] h-[67px] rounded-[50px] text-white'>
        <Input placeholder='Service, Artisans or Location' className='w-full pl-8 h-full border-none placeholder:text-white' />
        <button className='w-[113px] flex items-center justify-center h-full rounded-[50px] bg-pry'>
          <Search size={24} />
        </button>
      </div>
    </nav>
  );
}

export default ClientHeader;
