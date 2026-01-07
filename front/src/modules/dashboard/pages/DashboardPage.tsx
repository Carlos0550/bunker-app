import { Container, Title, Text, Grid, Paper, Stack } from '@mantine/core';
import { useAuthStore } from '../../auth/store';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Bienvenido de vuelta, {user?.name}</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" shadow="xs" withBorder>
              <Text size="sm" c="dimmed">Ventas del día</Text>
              <Title order={2}>$0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" shadow="xs" withBorder>
              <Text size="sm" c="dimmed">Productos en stock</Text>
              <Title order={2}>0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" shadow="xs" withBorder>
              <Text size="sm" c="dimmed">Clientes</Text>
              <Title order={2}>0</Title>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <Paper p="md" shadow="xs" withBorder>
              <Text size="sm" c="dimmed">Pedidos pendientes</Text>
              <Title order={2}>0</Title>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}


