import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function ListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>por pagina</span>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span>
          {firstItem}-{lastItem} de {totalItems}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Pagina anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            aria-label="Proxima pagina"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
