import React from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Props {

}

const Explore: React.FC<Props> = (props) => {
  return (
    <section className='w-full px-6 xl:px-0 h-[205px] bg-pry mt-[90px] mx-auto'>
      <div className='w-full xl:w-[1311px] mx-auto h-full'>
        <h3 className='text-white text-4xl pt-[28px]'>Explore</h3>

        <div className='w-full mx-auto bg-[#94B0F8] xl:w-[900px] mt-10 h-[68px] rounded-[50px] flex items-center'>
          <SearchIcon size={30} className='text-white ml-10' />
          <Input placeholder='Service Names, Service Categories or Location' className='w-full border-none h-full bg-inherit rounded-[50px] placeholder:text-white text-white' />
          <Button className='bg-white text-xl rounded-[50px] text-black w-[306px] h-full font-normal'>
            Enter
          </Button>
        </div>

      </div>
    </section>
  );
}

export default Explore;
