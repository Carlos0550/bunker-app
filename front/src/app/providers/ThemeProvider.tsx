import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      defaultColorScheme="dark"
      theme={{
        primaryColor: 'red',
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        colors: {
          // Custom red scale if needed, or use default 'red'
          // 'brand': [...]
        }
      }}
    >
      <Notifications position="top-right" />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  );
}

