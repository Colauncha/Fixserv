import React from 'react';
import { FaStar } from "react-icons/fa6";
import { FaStarHalfAlt } from "react-icons/fa";
import userIcon from '@/assets/images/userIcon.svg';


type RatedProps = {
  name: string;
  jobTitle: string;
}

const RatedCard: React.FC<RatedProps> = ({ name, jobTitle }) => {
  return (
    <div className='w-[468px] h-[434px] rounded-10 bg-[#AF949C] px-10 py-8'>
      <img src={userIcon} alt="user icon" />
      <div className='pt-2 text-[#FFFFFFCC]'>
        <h6 className='font-bold text-2xl'>
          {name}
        </h6>
        <p>{jobTitle}</p>
        <div className='flex items-center gap-1 pt-2'>
          <FaStar className='text-[#FFFFFFCC]' />
          <FaStar className='text-[#FFFFFFCC]' />
          <FaStar className='text-[#FFFFFFCC]' />
          <FaStar className='text-[#FFFFFFCC]' />
          <FaStarHalfAlt className='text-[#FFFFFFCC]' />
          <p className='text-xs font-bold text-[#FFFFFFCC]'>4.5</p>
        </div>
      </div>
      <div className='bg-white rounded-[5px] w-[380px] h-[155px] mt-5'></div>
    </div>
  );
}

export default RatedCard;
