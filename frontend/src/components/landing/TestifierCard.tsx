import React from 'react';
import { Avatar, AvatarImage } from '../ui/avatar';



interface Props {
  image: string;
  name: string;
  text: string;
}

const TestifierCard: React.FC<Props> = ({ image, name, text }) => {

  const imageUrl = new URL(`../../assets/images/landing/${image}.png`, import.meta.url);

  return (
    <div className='bg-pry-light w-[320px] py-6 px-4 h-[362px] rounded-[20px]'>
      <div className='flex gap-3 items-center'>
        <Avatar className='size-[61px]'>
          <AvatarImage src={`${imageUrl}`} />
        </Avatar>
        <h5 className='text-pry-accent text-2xl'>
          {name}
        </h5>
      </div>
      <div className='pt-[35px]'>
        <p className='text-2xl pl-8 tracking-tighter text-pry-accent leading-[30px]'>
          {text}
        </p>
      </div>
    </div>
  );
}

export default TestifierCard;
