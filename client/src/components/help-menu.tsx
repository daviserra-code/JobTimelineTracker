import React from 'react';
import { useTour } from '@reactour/tour';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HelpCircle, Gift, Info, Video, BookOpen, CalendarDays } from 'lucide-react';

export default function HelpMenu() {
  const { setIsOpen } = useTour();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Help & Resources</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer flex items-center"
          onClick={() => setIsOpen(true)}
        >
          <Gift className="mr-2 h-4 w-4 text-primary" />
          <span>Start Interactive Tour</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <Video className="mr-2 h-4 w-4 text-primary" />
          <span>Watch Tutorial Video</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>User Guide</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <CalendarDays className="mr-2 h-4 w-4" />
          <span>Keyboard Shortcuts</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer flex items-center">
          <Info className="mr-2 h-4 w-4" />
          <span>About Activity Calendar of Davide Serra</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}