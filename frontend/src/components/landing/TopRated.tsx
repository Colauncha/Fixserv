import React from 'react';
import RatedCard from './RatedCard';




interface Props {

}

const TopRated: React.FC<Props> = (props) => {
  return (
    <section className='mt-[78px] px-6 xl:px-0 h-full xl:h-[889px] w-full mx-auto'>
      <h5 className='text-black1 text-64 w-full xl:w-[1311px] mx-auto tracking-tighter font-medium'>Top Artisan</h5>
      <div className='flex flex-wrap xl:flex-nowrap mt-8 justify-center gap-4 w-full pt-[101px] bg-[#ECF1FC] h-full xl:h-[763px]'>
        {
          Array(1, 2, 3).map(item => (
            <RatedCard name='Abbas Akande' jobTitle='Laptop Engineer' key={item} />
          ))
        }
      </div>
    </section>
  );
}

export default TopRated;
