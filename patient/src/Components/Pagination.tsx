import React from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = [4, 6, 8, 12],
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-3 py-1 border border-gray-300 rounded-sm bg-white disabled:opacity-50"
          onClick={() => onPageChange(1)}
          disabled={safeCurrent === 1}
        >
          First
        </button>
        <button
          className="text-xs px-3 py-1 border border-gray-300 rounded-sm bg-white disabled:opacity-50"
          onClick={() => onPageChange(safeCurrent - 1)}
          disabled={safeCurrent === 1}
        >
          Prev
        </button>
        <span className="text-xs text-gray-600">
          Page {safeCurrent} of {safeTotal}
        </span>
        <button
          className="text-xs px-3 py-1 border border-gray-300 rounded-sm bg-white disabled:opacity-50"
          onClick={() => onPageChange(safeCurrent + 1)}
          disabled={safeCurrent === safeTotal}
        >
          Next
        </button>
        <button
          className="text-xs px-3 py-1 border border-gray-300 rounded-sm bg-white disabled:opacity-50"
          onClick={() => onPageChange(safeTotal)}
          disabled={safeCurrent === safeTotal}
        >
          Last
        </button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="cursor-pointer p-1 border border-gray-300 rounded-sm bg-gray-50 text-[11px] outline-none"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
