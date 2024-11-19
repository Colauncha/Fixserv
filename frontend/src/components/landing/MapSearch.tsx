import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import gmap from '@/assets/images/gmap.png'

interface Props {

}

const MapSearch: React.FC<Props> = (props) => {
  return (
    <section className='w-full xl:w-[1138px] mx-auto h-[610px] py-6 bg-[#F998981A] rounded-[30px] mt-[67px]'>
      <div className='w-full pl-[60px]'>
        <div className='border-[#A56377] border w-[337px] h-[62px] rounded-[20px] flex items-center bg-white'>
          <Button size='icon' className='w-[78px] bg-[#A56377] h-[62px] rounded-[20px] text-white'>
            <Search />
          </Button>
          <Input type='text' placeholder='Search' className='w-full h-full rounded-[20px] border-none' />
        </div>
      </div>
      <div className='w-full px-[33px] mt-4 h-[475px]'>
        <img src={gmap} alt="" className='block object-cover w-full h-full' />
      </div>
    </section>
  );
}

export default MapSearch;
