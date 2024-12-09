import React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  // NavigationMenuIndicator,
  NavigationMenuItem,
  // NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  // NavigationMenuViewport,
} from "@/components/ui/navigation-menu"


const ClientNavItems: React.FC = () => {
  return (
    <div className='w-full xl:w-[1309px] mx-auto mt-[46px]'>
      <NavigationMenu className='w-full mx-auto'>
        <NavigationMenuList className='space-x-10'>
          <NavigationMenuItem className=''>
            <NavigationMenuTrigger className='text-2xl font-normal bg-[#ECF1FC] h-[50px] w-[300px]'>
              Television
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className='w-[300px] bg-white p-3'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos quaerat, quasi exercitationem aperiam, tenetur beatae nisi doloribus, quod magni quas vero. Et beatae assumenda eligendi voluptatibus accusantium repellat soluta tempora?
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className='relative'>
            <NavigationMenuTrigger className='text-2xl font-normal bg-[#ECF1FC] h-[50px] w-[300px]'>
              Refrigerator
            </NavigationMenuTrigger>
            <NavigationMenuContent className=''>
              <div className='w-[400px] bg-white p-3'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className=''>
            <NavigationMenuTrigger className='text-2xl font-normal bg-[#ECF1FC] h-[50px] w-[300px]'>
              Gadgets
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className='w-[300px] bg-white p-3'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className=''>
            <NavigationMenuTrigger className='text-2xl font-normal bg-[#ECF1FC] h-[50px] w-[300px]'>
              Game Gadgets
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className='w-[300px] bg-white p-3'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>

    </div>
  );
}

export default ClientNavItems;
