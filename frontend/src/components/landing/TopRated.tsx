import React from 'react';
import RatedCard from './RatedCard';




interface Props {

}

const TopRated: React.FC<Props> = (props) => {
  return (
    <section className='mt-[69px] w-full xl:w-[1198px] mx-auto'>
      <h5 className='text-black text-3xl'>Top Rated Artisan</h5>
      <div className='h-full lg:h-[510px] bg-[#F998981A] w-full grid items-center overflow-x-auto overscroll-x-contain snap-mandatory scroll-px-1 gap-6 grid-flow-col px-5 rounded-[20px] mt-5 reset'>
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
