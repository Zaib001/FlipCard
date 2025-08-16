import React, { createContext, useState } from 'react';
import { limbusTheme } from '../styles/theme/colors';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(limbusTheme);
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = (newTheme) => {
    if (newTheme) {
      setTheme({ ...limbusTheme, ...newTheme });
    } else {
      setDarkMode(!darkMode);
      setTheme({
        ...theme,
        background: {
          ...theme.background,
          base: darkMode ? '#f8fafc' : '#0f172a'
        },
        text: {
          primary: darkMode ? '#0f172a' : '#f8fafc',
          secondary: darkMode ? '#475569' : '#94a3b8'
        }
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div 
        className="transition-colors duration-300"
        style={{
          '--color-primary': theme.primary,
          '--color-secondary': theme.secondary,
          '--color-bg-base': theme.background.base,
          '--color-text-primary': theme.text.primary
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};