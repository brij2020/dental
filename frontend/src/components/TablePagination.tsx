import { IconChevronLeft, IconChevronRight, IconLoader2 } from '@tabler/icons-react';

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  summaryLabel?: string;
};

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  isLoading = false,
  onPageChange,
  className = '',
  summaryLabel = 'Showing',
}: TablePaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <p className="text-sm text-slate-600">
        {summaryLabel} {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <div className="inline-flex min-w-36 items-center justify-center gap-2 text-sm text-slate-600">
          {isLoading && <IconLoader2 className="h-4 w-4 animate-spin" />}
          <span>Page {currentPage} of {Math.max(1, totalPages)}</span>
        </div>
        <button
          onClick={() => onPageChange(Math.min(Math.max(1, totalPages), currentPage + 1))}
          disabled={currentPage >= totalPages || isLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
