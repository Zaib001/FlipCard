import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext();
export const useTheme = () => useContext(ThemeCtx);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [skin, setSkin] = useState("neon-cyan");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-skin", skin);
  }, [theme, skin]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, skin, setSkin }}>
      {children}
    </ThemeCtx.Provider>
  );
}
