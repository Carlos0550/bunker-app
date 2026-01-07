import { useState } from 'react';
import { Container, Title, Button, Group, TextInput, Table, Paper, Stack, Badge, ActionIcon } from '@mantine/core';
import { useProducts, useDeleteProduct } from '../hooks';
import { formatCurrency } from '@shared/utils';

export function StockListPage() {
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  
  const { data, isLoading } = useProducts({ page, pageSize: 10, search });
  const { mutate: deleteProduct } = useDeleteProduct();

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Inventario</Title>
          <Button>Agregar Producto</Button>
        </Group>

        <Paper p="md" withBorder>
          <TextInput
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </Paper>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th>Precio</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                    Cargando...
                  </Table.Td>
                </Table.Tr>
              ) : data?.data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                    No hay productos
                  </Table.Td>
                </Table.Tr>
              ) : (
                data?.data.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>{product.sku}</Table.Td>
                    <Table.Td>{product.name}</Table.Td>
                    <Table.Td>{product.category}</Table.Td>
                    <Table.Td>{formatCurrency(product.price)}</Table.Td>
                    <Table.Td>{product.stock}</Table.Td>
                    <Table.Td>
                      <Badge 
                        variant={product.stock > 10 ? 'light' : product.stock > 0 ? 'filled' : 'filled'}
                        color="red"
                      >
                        {product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Bajo' : 'Agotado'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light">
                          ✏️
                        </ActionIcon>
                        <ActionIcon variant="light" onClick={() => handleDelete(product.id)}>
                          🗑️
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}

