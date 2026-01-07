import { Outlet } from 'react-router-dom';
import { AppShell, Burger, Group, Text, Button, Avatar, Menu, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuthStore } from '../modules/auth/store';
import { useLogout } from '../modules/auth/hooks';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogout();
  const theme = useMantineTheme();

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
      <AppShell.Header bg="dark.0" style={{ borderBottom: `1px solid ${theme.colors.red[5]}` }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="dark.9" />
            <Text size="xl" fw={700} c="dark.9">
              Bunker App
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" p={0}>
                <Group gap="xs">
                  <Avatar size={32} radius="xl" >
                    {user?.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm" fw={500} c="dark.9">
                    {user?.name}
                  </Text>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item>Perfil</Menu.Item>
              <Menu.Item>Configuración</Menu.Item>
              <Menu.Divider />
              <Menu.Item onClick={() => logout()}>
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="dark.0" style={{ borderRight: `1px solid ${theme.colors.red[5]}` }}>
        { }
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}


