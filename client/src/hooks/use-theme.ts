import { useEffect } from 'react';
import { useUserPreferences } from './use-user-preferences';

export function useTheme() {
  const { preferences } = useUserPreferences();
  
  useEffect(() => {
    // Apply the theme from preferences
    const theme = preferences.theme || 'light';
    
    // Remove any previous theme classes
    document.documentElement.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      
      // Listen for changes in system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Apply the specified theme
      document.documentElement.classList.add(theme);
    }
  }, [preferences.theme]);
  
  return {
    currentTheme: preferences.theme || 'light'
  };
}