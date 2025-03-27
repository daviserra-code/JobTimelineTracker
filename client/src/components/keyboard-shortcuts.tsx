import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

type ShortcutItem = {
  keys: string[];
  description: string;
};

type ShortcutCategory = {
  name: string;
  shortcuts: ShortcutItem[];
};

const KEYBOARD_SHORTCUTS: ShortcutCategory[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['←', '→'], description: 'Navigate between months/weeks/days' },
      { keys: ['Home'], description: 'Go to today' },
      { keys: ['T'], description: 'Toggle between view modes' },
      { keys: ['Y'], description: 'Go to year view' },
      { keys: ['M'], description: 'Go to month view' },
      { keys: ['W'], description: 'Go to week view' },
      { keys: ['D'], description: 'Go to day view' },
    ]
  },
  {
    name: 'Activities',
    shortcuts: [
      { keys: ['N'], description: 'Create new activity' },
      { keys: ['E'], description: 'Edit selected activity' },
      { keys: ['Delete'], description: 'Delete selected activity' },
      { keys: ['Esc'], description: 'Deselect activity' },
    ]
  },
  {
    name: 'Views',
    shortcuts: [
      { keys: ['+'], description: 'Zoom in timeline' },
      { keys: ['-'], description: 'Zoom out timeline' },
      { keys: ['F'], description: 'Toggle filters panel' },
      { keys: ['S'], description: 'Focus search bar' },
      { keys: ['?'], description: 'Open this help dialog' },
    ]
  }
];

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span>Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the calendar more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-4">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.name} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{category.name}</h3>
              <div className="rounded-md border">
                <div className="divide-y">
                  {category.shortcuts.map((shortcut) => (
                    <div 
                      key={shortcut.description} 
                      className="flex items-center justify-between p-2"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key) => (
                          <kbd 
                            key={key}
                            className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          <p>Tip: Press <kbd className="px-1 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded border">?</kbd> anywhere in the app to show this dialog.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}