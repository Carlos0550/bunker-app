import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme } from '@styles/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  );
}

