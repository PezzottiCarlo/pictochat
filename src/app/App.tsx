import { RouterProvider } from 'react-router';
import { ThemeProvider } from '@/theme';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
