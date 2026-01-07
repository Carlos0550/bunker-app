import { Outlet } from 'react-router-dom';
import { AppShell, Burger, Group, Text, Button, Avatar, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuthStore } from '../modules/auth/store';
import { useLogout } from '../modules/auth/hooks';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogout();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="xl" fw={700}>
              Bunker App
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" p={0}>
                <Group gap="xs">
                  <Avatar size={32} radius="xl" color="blue">
                    {user?.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500}>
                    {user?.name}
                  </Text>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Cuenta</Menu.Label>
              <Menu.Item>Perfil</Menu.Item>
              <Menu.Item>Configuración</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" onClick={() => logout()}>
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text size="sm" fw={500} c="dimmed" mb="md">
          Navegación
        </Text>
        { }
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}


