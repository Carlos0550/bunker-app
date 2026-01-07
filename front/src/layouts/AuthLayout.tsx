import { Outlet } from 'react-router-dom';
import { Box, Flex, Title, Text, Stack, useMantineTheme } from '@mantine/core';

export function AuthLayout() {
  const theme = useMantineTheme();

  return (
    <Flex mih="100vh">
      <Box
        visibleFrom="md"
        style={{
          flex: 1,
          background: `linear-gradient(135deg, ${theme.colors.red[9]} 0%, ${theme.colors.red[8]} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        
        <Stack gap="xl" style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <Box>
            <Text size="xl" fw={700} style={{ opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Bunker App
            </Text>
            <Title order={1} size={48} mt="sm" fw={900} lh={1.1}>
              Gestiona tu negocio con seguridad y confianza
            </Title>
            <Text size="lg" mt="md" style={{ opacity: 0.9 }}>
              La plataforma integral para el control de inventario, ventas y clientes.
            </Text>
          </Box>
        </Stack>
      </Box>

      { }
      <Flex
        align="center"
        justify="center"
        style={{
          flex: 1,
          backgroundColor: 'var(--mantine-color-body)',
          position: 'relative',
        }}
      >
        <Box w="100%" maw={480} p="md">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}


