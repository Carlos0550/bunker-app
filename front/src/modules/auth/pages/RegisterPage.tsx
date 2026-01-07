import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Title, Text, Stack, Anchor, Checkbox } from '@mantine/core';
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
        <Title order={2} size={32} fw={800} ta="center" c="dark.9">
          Crear una cuenta
        </Title>
        <Text size="sm" ta="center" c="dark.9">
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
            c="dark.9"
          />

          <Button type="submit" fullWidth loading={isPending} size="md" radius="md" mt="sm" disabled={!terms}>
            Registrarse
          </Button>
        </Stack>
      </form>

      <Text size="sm" ta="center" c="dark.9">
        ¿Ya tienes una cuenta?{' '}
        <Anchor component={Link} to="/login" fw={500}>
          Inicia sesión
        </Anchor>
      </Text>
    </Stack>
  );
}


