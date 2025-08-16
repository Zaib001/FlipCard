import Arena from "./pages/Arena";
import ThemeProvider from "./theme/ThemeProvider";

export default function App(){
  return (
    <ThemeProvider>
      <Arena />
    </ThemeProvider>
  );
}
