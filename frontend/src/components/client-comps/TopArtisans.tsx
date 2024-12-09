import React from 'react';
import { FaStar } from "react-icons/fa6";
import { IoLocation } from "react-icons/io5";
import image from '@/assets/images/landing/image1.png'
import { Button } from '../ui/button';
import ArtisanCard from './ArtisanCard';



interface Props {

};


const TopArtisans: React.FC<Props> = (props) => {
  const artisans: ClientDetail[] = [
    {
      id: '1',
      name: 'Abbas Akande',
      rating: '5.0',
      ratingComment: 'Artisan is highly rated ',
      location: 'Ikeja, Lagos State'
    },
    {
      id: '2',
      name: 'Abbas Akande',
      rating: '5.0',
      ratingComment: 'Artisan is highly rated ',
      location: 'Ikeja, Lagos State'
    },
    {
      id: '3',
      name: 'Abbas Akande',
      rating: '5.0',
      ratingComment: 'Artisan is highly rated ',
      location: 'Ikeja, Lagos State'
    },
  ];

  return (
    <section className='w-full px-4 xl:px-0 h-full pb-[200px] xl:w-[1309px] mx-auto mt-16'>
      <h3 className='text-3xl font-medium'>Top Artisans</h3>

      <div className='w-full grid grid-cols-3 gap-2 justify-items-center'>
        {
          artisans.map(item => (
            <ArtisanCard key={item.id} artisan={item} />
          ))
        }
      </div>

      <div className='w-full mt-24'>
        <h3 className='text-3xl font-medium'>Available Artisans</h3>
        <div className='w-full grid grid-cols-3 gap-2 justify-items-center'>
          {
            artisans.map(item => (
              <ArtisanCard key={item.id} artisan={item} />
            ))
          }
        </div>
      </div>

      <div className='w-full mt-24'>
        <h3 className='text-3xl font-medium'>Booked Artisans</h3>
        <div className='w-full grid grid-cols-3 gap-2 justify-items-center'>
          {
            artisans.map(item => (
              <ArtisanCard key={item.id} artisan={item} />
            ))
          }
        </div>
      </div>
    </section>
  );
}

export default TopArtisans;
