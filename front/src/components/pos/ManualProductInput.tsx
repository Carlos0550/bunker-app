import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface ManualProductInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onShowHelp: () => void;
}

export function ManualProductInput({
  value,
  onChange,
  onSubmit,
  onShowHelp,
}: ManualProductInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bunker-card p-3" data-tour="pos-manual">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Carga Manual</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onShowHelp}
        >
          ¿Cómo funciona?
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Ej: 2 coca cola 2500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          className="flex-1 bg-secondary/50"
        />
        <Button onClick={onSubmit} disabled={!value.trim()}>
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
