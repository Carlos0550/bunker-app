import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Title, Text, Stack, Checkbox } from '@mantine/core';
import { useRegister } from '../hooks';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const { mutate: register, isPending } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ name, email, password });
  };

  return (
    <Stack gap="xl" px="md">
      <Stack gap="xs" align="center">
        <Title order={2} size={32} fw={800} ta="center">
          Crear una cuenta
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Únete a Bunker App y gestiona tu negocio
        </Text>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Nombre completo"
            placeholder="Tu nombre"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            size="md"
            radius="md"
          />
          <TextInput
            label="Correo electrónico"
            placeholder="tu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            size="md"
            radius="md"
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            size="md"
            radius="md"
          />
          
          <Checkbox 
            label="Acepto los términos y condiciones" 
            checked={terms}
            onChange={(event) => setTerms(event.currentTarget.checked)}
            size="xs"
            mt="xs"
            color="red"
          />

          <Button type="submit" fullWidth loading={isPending} size="md" radius="md" mt="sm" disabled={!terms} color="red">
            Registrarse
          </Button>
        </Stack>
      </form>

      <Text c="dimmed" size="sm" ta="center">
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" style={{ color: 'var(--mantine-color-red-filled)', fontWeight: 500, textDecoration: 'none' }}>
          Inicia sesión
        </Link>
      </Text>
    </Stack>
  );
}


