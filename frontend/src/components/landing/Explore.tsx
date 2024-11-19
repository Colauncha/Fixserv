import React from 'react';
import { SearchIcon } from 'lucide-react';
import { AiFillCaretDown } from "react-icons/ai";
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Props {

}

const Explore: React.FC<Props> = (props) => {
  return (
    <section className='w-full xl:w-[1106px] h-[205px] bg-[#F998984D] px-6 mt-4 mx-auto'>
      <h3 className='text-black text-40 pt-3'>Explore</h3>
      <div className='w-full mx-auto bg-white mt-5 h-[92px] rounded-[50px] flex items-center px-2.5'>
        <Button className='bg-[#A56377] h-[78px] text-white w-[111px] font-normal rounded-[50px]'>
          All
          <AiFillCaretDown />
        </Button>
        <Input className='w-full border-none h-full bg-inherit rounded-[50px]' />
        <Button className='bg-[#A56377] text-xl rounded-[50px] text-white w-[306px] h-[78px] font-normal'>
          <SearchIcon className='font-bold' />
          Request for service
        </Button>
      </div>
    </section>
  );
}

export default Explore;
