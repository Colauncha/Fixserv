import React from 'react';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import banner from '@/assets/images/landing/testi-banner.png';
import image1 from '@/assets/images/landing/image1.png';
import TestifierCard from './TestifierCard';


interface Props {

}

const Testimonial: React.FC<Props> = (props) => {

  const testimonial = [
    {
      id: '1',
      name: 'Maxwell Davies',
      text: 'Fixserv’s service is mind blowing, my gadget was fixed well and it was done on time',
      image: 'image1'
    },
    {
      id: '2',
      name: 'Shaw Combs',
      text: 'Fixserv helped me to fix my gadget and I had no complains after',
      image: 'image2'
    },
    {
      id: '3',
      name: 'Aramide Balogun',
      text: 'Fixserv is a very reliable company, my laptop was well fixed',
      image: 'image3'
    },
  ];

  return (
    <section className='w-full mt-[70px] px-6 xl:px-0 h-full xl:h-[700px] relative'>
      <img src={banner} alt="" className='block h-[441px] bg-cover w-full' />
      <h4 className='font-medium absolute top-10 text-[52px] text-white tracking-tighter left-[65px]'>
        CLIENTS TESTIMONY
      </h4>
      <div className='w-full absolute bottom-0 xl:w-[1311px] mx-auto flex gap-12 justify-center -translate-x-[50%] left-1/2'>
        {
          testimonial.map(item => (
            <TestifierCard key={item.id} name={item.name} text={item.text} image={item.image} />
          ))
        }
      </div>
    </section>
  );
}

export default Testimonial;
