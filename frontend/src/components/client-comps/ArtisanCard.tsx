import React from 'react';
import { Button } from '../ui/button';
import { FaStar } from 'react-icons/fa6';
import { IoLocation } from 'react-icons/io5';
import image from '@/assets/images/landing/image1.png'



interface Props {
  artisan: ClientDetail;
}

const ArtisanCard: React.FC<Props> = ({ artisan }) => {
  return (
    <>
      <div className='w-[400px] h-[500px] mt-[15px]'>
        <div className='w-full h-[390px] rounded-[15px] flex flex-col justify-between bg-[#ECF1FC] items-center pt-10 pb-7'>
          <div>
            <div className='rounded-full  size-[148px]'>
              <img src={image} alt="" className='block object-cover w-full h-full' />
            </div>
            <p className='text-2xl font-medium pt-4'> {artisan.name}</p>
          </div>
          <Button className='bg-[#7A9DF7] text-white text-xl rounded-[15px] h-12 w-[230px]'>
            Book Artisan
          </Button>
        </div>

        <div className='pt-8'>
          <div className='flex items-center gap-2'>
            <FaStar />
            <p>{artisan.rating}</p>
          </div>
          <p className='text-[#110000C2]'>{artisan.ratingComment} </p>
          <div className='flex gap-2 items-center'>
            <IoLocation />
            <p>{artisan.location}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ArtisanCard;
