import React from 'react'
import image from '@/assets/images/landing/about.png';



const About: React.FC = () => {
  return (
    <section className='px-6 xl:px-0 w-full bg-[#ECF1FC] h-full xl:h-[636px]'>
      <div className='w-full flex h-full items-center gap-[120px] mx-auto xl:w-[1311px]'>
        <div className='w-full xl:w-[540px]'>
          <img src={image} alt="phone" />
        </div>
        <div className='w-full xl:w-[540px]'>
          <h3 className='text-[#110000C2] font-medium text-64'>About </h3>
          <p className='text-3xl text-[#110000C2]'>
            Fixserv is a digital marketplace that connects users with professional artisans specializing in gadget repairs and services
          </p>
          <p className='text-3xl text-[#110000C2] pt-5'>
            We offer a seamless way for customers to find, book, and engage certified experts for fixing electronics, mobile devices, home appliances and other gadgets
          </p>
        </div>
      </div>
    </section>
  )
}

export default About