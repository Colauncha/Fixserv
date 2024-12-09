import React from 'react';

interface Props {

}

const TopArtisans: React.FC<Props> = (props) => {
  return (
    <section className='w-full xl:w-[1309px] mx-auto mt-[46px]'>
      <h3 className='text-3xl'>Top Artisans</h3>

      <div className='w-[370px] h-[500px]'>
        <div className='w-full h-[390px] rounded-[15px] bg-[#ECF1FC]'>
          <img src="" alt="" />
        </div>
      </div>
    </section>
  );
}

export default TopArtisans;
