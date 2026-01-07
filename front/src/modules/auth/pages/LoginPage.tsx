import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Title, Text, Stack, Anchor, Group, Checkbox } from '@mantine/core';
import { useLogin } from '../hooks';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <Stack gap="xl" px="md">
      <Stack gap="xs" align="center">
        <Title order={2} size={32} fw={800} ta="center">
          Bienvenido de nuevo
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Ingresa tus credenciales para acceder a tu cuenta
        </Text>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Correo electrónico"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            size="md"
            radius="md"
          />
          
          <Stack gap="xs">
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              size="md"
              radius="md"
            />
            <Group justify="space-between">
              <Checkbox label="Recordarme" size="xs" color="red" />
              <Anchor component="button" type="button" size="xs" c="red">
                ¿Olvidaste tu contraseña?
              </Anchor>
            </Group>
          </Stack>

          <Button type="submit" fullWidth loading={isPending} size="md" radius="md" mt="sm" color="red">
            Iniciar sesión
          </Button>
        </Stack>
      </form>

      <Text c="dimmed" size="sm" ta="center">
        ¿No tienes una cuenta?{' '}
        <Link to="/register" style={{ color: 'var(--mantine-color-red-filled)', fontWeight: 500, textDecoration: 'none' }}>
          Regístrate gratis
        </Link>
      </Text>
    </Stack>
  );
}


