import React from 'react';
import Banner from '@/components/landing/Banner';
import Explore from '@/components/landing/Explore';
import TopRated from '@/components/landing/TopRated';
import MapSearch from '@/components/landing/MapSearch';
import Testimonial from '@/components/landing/Testimonial';
import About from '@/components/landing/About';

const HomePage: React.FC = () => {
  return (
    <section>
      <Banner />
      <TopRated />
      <MapSearch />
      <About />
      <Explore />
      <Testimonial />
    </section>
  );
}

export default HomePage;
