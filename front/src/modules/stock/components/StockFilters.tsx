import { TextInput, Select, NumberInput, Group, Button, Paper } from '@mantine/core';
import type { StockFilters } from '../types';

interface StockFiltersProps {
  filters: StockFilters;
  onChange: (filters: StockFilters) => void;
  onClear: () => void;
}

export function StockFilters({ filters, onChange, onClear }: StockFiltersProps) {
  return (
    <Paper p="md" withBorder>
      <Group>
        <TextInput
          placeholder="Buscar productos..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value })}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Categoría"
          value={filters.category || ''}
          onChange={(value) => onChange({ ...filters, category: value || undefined })}
          data={[
            { value: 'electronics', label: 'Electrónica' },
            { value: 'clothing', label: 'Ropa' },
            { value: 'food', label: 'Alimentos' },
          ]}
          clearable
        />
        <NumberInput
          placeholder="Stock mínimo"
          value={filters.minStock}
          onChange={(value) => onChange({ ...filters, minStock: value as number })}
          min={0}
        />
        <NumberInput
          placeholder="Stock máximo"
          value={filters.maxStock}
          onChange={(value) => onChange({ ...filters, maxStock: value as number })}
          min={0}
        />
        <Button variant="light" onClick={onClear}>
          Limpiar
        </Button>
      </Group>
    </Paper>
  );
}


