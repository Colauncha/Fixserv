import React from 'react';
import { Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import logo from '@/assets/images/logo.svg';
import { navLinks } from '@/constants/links';
import { Button } from '../ui/button';


const MobileNav: React.FC = () => {
  return (
    <aside>
      <Sheet>
        <SheetTrigger className=''>
          <Menu size={24} />
        </SheetTrigger>
        <SheetContent className='bg-white'>
          <SheetHeader>
            <SheetTitle>
              <img src={logo} alt="company logo" />
            </SheetTitle>
            <SheetDescription className='pt-12'>
              <div className='space-y-5'>
                {navLinks.map(link => (
                  <NavLink to={''} key={link.id} className='block text-pry text-xl'>
                    {link.routeName}
                  </NavLink>
                ))}
                <Button className='w-[167px] h-11 rounded-10 text-xl bg-pry text-white'>
                  Log in
                </Button>
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

    </aside>
  );
}

export default MobileNav;
