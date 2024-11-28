import React from 'react';
import { Button } from '../ui/button';
import { FaChevronDown } from "react-icons/fa6";
import gmap from '@/assets/images/landing/map.png';
import gisLocation from '@/assets/images/landing/location.svg';



interface Props {

}

const MapSearch: React.FC<Props> = (props) => {
  return (
    <section className='w-full px-6 xl:px-0 mx-auto h-full py-6 rounded-[30px] mt-[67px]'>
      <div className='w-full xl:w-[1311px] mx-auto'>
        <h3 className='text-[52px] tracking-tight font-medium'>
          Available Locations
        </h3>

        <Button className='bg-pry mt-6 text-xl w-[231px] px-[27px] justify-between text-white rounded-[50px] h-[65px]'>
          <img src={gisLocation} alt="" />
          <p>Location</p>
          <FaChevronDown />
        </Button>
      </div>
      <div className='h-full lg:h-[978px] mt-14'>
        <img src={gmap} alt="" />
      </div>
    </section>
  );
}

export default MapSearch;
