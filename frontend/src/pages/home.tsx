import React from 'react';
import Banner from '@/components/landing/Banner';
import Explore from '@/components/landing/Explore';
import TopRated from '@/components/landing/TopRated';
import MapSearch from '@/components/landing/MapSearch';

const HomePage: React.FC = () => {
  return (
    <section>
      <Banner />
      <Explore />
      <TopRated />
      <MapSearch />
    </section>
  );
}

export default HomePage;
