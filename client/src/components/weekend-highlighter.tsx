import React, { useEffect } from 'react';

/**
 * Helper function to determine if a day is a weekend (Saturday or Sunday)
 * @param day - The date to check
 * @returns true if the day is Saturday (6) or Sunday (0)
 */
export const isWeekend = (day: Date) => {
  return day.getDay() === 0 || day.getDay() === 6;
};

/**
 * Component that applies weekend highlighting to all day cells in the calendar
 */
export default function WeekendHighlighter() {
  useEffect(() => {
    // Apply styling to weekend cells after the DOM has loaded
    const applyWeekendHighlighting = () => {
      document.querySelectorAll('.day-cell').forEach((cell) => {
        const dateAttr = cell.getAttribute('data-date');
        if (!dateAttr) return;
        
        const date = new Date(dateAttr);
        if (isWeekend(date)) {
          cell.classList.add('weekend-day');
        }
      });
    };
    
    // Apply immediately and also when the DOM updates
    applyWeekendHighlighting();
    
    // Set up a mutation observer to watch for changes to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          applyWeekendHighlighting();
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return null; // This is a utility component, it doesn't render anything
}