import { Container, Title, Text, Grid, Paper, Stack, useMantineTheme } from '@mantine/core';
import { useAuthStore } from '../../auth/store';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const theme = useMantineTheme();

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} c="dark.9">Dashboard</Title>
          <Text c="dark.6">Bienvenido de vuelta, {user?.name}</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" withBorder bg="dark.0" style={{ borderColor: theme.colors.red[5] }}>
              <Text size="sm" c="dark.6">Ventas del día</Text>
              <Title order={2} c="dark.9">$0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" withBorder bg="dark.0" style={{ borderColor: theme.colors.red[5] }}>
              <Text size="sm" c="dark.6">Productos en stock</Text>
              <Title order={2} c="dark.9">0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" withBorder bg="dark.0" style={{ borderColor: theme.colors.red[5] }}>
              <Text size="sm" c="dark.6">Clientes</Text>
              <Title order={2} c="dark.9">0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" withBorder bg="dark.0" style={{ borderColor: theme.colors.red[5] }}>
              <Text size="sm" c="dark.6">Pedidos pendientes</Text>
              <Title order={2} c="dark.9">0</Title>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}


