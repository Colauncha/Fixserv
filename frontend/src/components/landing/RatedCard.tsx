import React from 'react';
import { FaStar } from "react-icons/fa6";
import { FaStarHalfAlt } from "react-icons/fa";
import image1 from '@/assets/images/landing/image1.png';


type RatedProps = {
  name: string;
  jobTitle: string;
}

const RatedCard: React.FC<RatedProps> = ({ name, jobTitle }) => {
  return (
    <div className='w-[420px] h-[524px] rounded-10 bg-[#A1B7F2] py-8 flex justify-center'>
      <div className='w-full'>
        <div className='size-[124px] rounded-full bg-[#D9D9D9] mx-auto'>
          <img src={image1} alt="" />
        </div>

        <div className='pt-2 text-[#FFFFFFCC]'>
          <h6 className='font-bold text-2xl text-center'>
            {name}
          </h6>
          <p className='text-center'>{jobTitle}</p>
          <div className='w-full justify-center flex items-center gap-1 pt-2'>
            <FaStar className='text-[#FFFFFFCC]' />
            <FaStar className='text-[#FFFFFFCC]' />
            <FaStar className='text-[#FFFFFFCC]' />
            <FaStar className='text-[#FFFFFFCC]' />
            <FaStarHalfAlt className='text-[#FFFFFFCC]' />
            <p className='text-xs font-bold text-[#FFFFFFCC]'>4.5</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default RatedCard;
