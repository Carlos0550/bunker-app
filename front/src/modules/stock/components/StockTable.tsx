import { Table, Badge, ActionIcon, Group } from '@mantine/core';
import { formatCurrency } from '@shared/utils';
import type { Product } from '../types';

interface StockTableProps {
  products: Product[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function StockTable({ products, onEdit, onDelete }: StockTableProps) {
  return (
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
        {products.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
              No hay productos
            </Table.Td>
          </Table.Tr>
        ) : (
          products.map((product) => (
            <Table.Tr key={product.id}>
              <Table.Td>{product.sku}</Table.Td>
              <Table.Td>{product.name}</Table.Td>
              <Table.Td>{product.category}</Table.Td>
              <Table.Td>{formatCurrency(product.price)}</Table.Td>
              <Table.Td>{product.stock}</Table.Td>
              <Table.Td>
                <Badge color={product.stock > 10 ? 'green' : product.stock > 0 ? 'yellow' : 'red'}>
                  {product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Bajo' : 'Agotado'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="light" color="blue" onClick={() => onEdit(product.id)}>
                    ✏️
                  </ActionIcon>
                  <ActionIcon variant="light" color="red" onClick={() => onDelete(product.id)}>
                    🗑️
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}


