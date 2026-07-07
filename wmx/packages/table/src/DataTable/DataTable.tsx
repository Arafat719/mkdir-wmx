import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import "./DataTable.css";

export type SortDirection = "asc" | "desc";
export type ColumnAlign = "left" | "center" | "right";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  align?: ColumnAlign;
  width?: number | string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  selectable?: boolean;
  onSelectionChange?: (keys: (string | number)[]) => void;
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: ReactNode;
  loading?: boolean;
  striped?: boolean;
  dense?: boolean;
  stickyHeader?: boolean;
  className?: string;
}

function cellValue<T>(column: DataTableColumn<T>, row: T): ReactNode {
  if (column.accessor) return column.accessor(row);
  return (row as Record<string, unknown>)[column.key] as ReactNode;
}

function sortValueOf<T>(column: DataTableColumn<T>, row: T): string | number {
  if (column.sortValue) return column.sortValue(row);
  const value = (row as Record<string, unknown>)[column.key];
  if (typeof value === "number") return value;
  return String(value ?? "");
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  onSelectionChange,
  pageSize,
  defaultSortKey,
  defaultSortDirection = "asc",
  onSortChange,
  searchable = false,
  searchPlaceholder = "Search…",
  onRowClick,
  emptyMessage = "No data to display",
  loading = false,
  striped = false,
  dense = false,
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const needle = query.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((column) => String(cellValue(column, row) ?? "").toLowerCase().includes(needle))
    );
  }, [data, columns, searchable, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = sortValueOf(column, a);
      const bv = sortValueOf(column, b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, columns, sortKey, sortDirection]);

  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    if (!pageSize) return sorted;
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSize, currentPage]);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    let nextDirection: SortDirection = "asc";
    if (sortKey === column.key) {
      nextDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortKey(column.key);
    setSortDirection(nextDirection);
    onSortChange?.(column.key, nextDirection);
  };

  const emitSelection = (keys: Set<string | number>) => {
    setSelectedKeys(keys);
    onSelectionChange?.(Array.from(keys));
  };

  const toggleRow = (key: string | number) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    emitSelection(next);
  };

  const pageKeys = paged.map(rowKey);
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));
  const somePageSelected = pageKeys.some((k) => selectedKeys.has(k));

  const toggleAllOnPage = () => {
    const next = new Set(selectedKeys);
    if (allPageSelected) {
      pageKeys.forEach((k) => next.delete(k));
    } else {
      pageKeys.forEach((k) => next.add(k));
    }
    emitSelection(next);
  };

  const classes = [
    "wmx-datatable",
    striped && "wmx-datatable--striped",
    dense && "wmx-datatable--dense",
    stickyHeader && "wmx-datatable--sticky",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const goToPage = (next: number) => setPage(Math.min(Math.max(1, next), pageCount));

  return (
    <div className={classes}>
      {searchable && (
        <div className="wmx-datatable__toolbar">
          <input
            type="search"
            className="wmx-datatable__search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      )}

      <div className="wmx-datatable__scroll">
        <table className="wmx-datatable__table">
          <thead className="wmx-datatable__head">
            <tr>
              {selectable && (
                <th className="wmx-datatable__cell wmx-datatable__cell--checkbox">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allPageSelected && somePageSelected;
                    }}
                    onChange={toggleAllOnPage}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    "wmx-datatable__cell",
                    "wmx-datatable__cell--head",
                    column.sortable && "wmx-datatable__cell--sortable",
                    column.align && `wmx-datatable__cell--${column.align}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width: column.width }}
                  onClick={() => toggleSort(column)}
                  aria-sort={sortKey === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                >
                  <span className="wmx-datatable__head-label">
                    {column.header}
                    {column.sortable && (
                      <span className="wmx-datatable__sort-icon" aria-hidden="true">
                        {sortKey === column.key ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="wmx-datatable__body">
            {loading && (
              <tr>
                <td className="wmx-datatable__cell wmx-datatable__state" colSpan={columns.length + (selectable ? 1 : 0)}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td className="wmx-datatable__cell wmx-datatable__state" colSpan={columns.length + (selectable ? 1 : 0)}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              paged.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className={[
                      "wmx-datatable__row",
                      isSelected && "wmx-datatable__row--selected",
                      onRowClick && "wmx-datatable__row--clickable",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td
                        className="wmx-datatable__cell wmx-datatable__cell--checkbox"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={["wmx-datatable__cell", column.align && `wmx-datatable__cell--${column.align}`]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {cellValue(column, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {pageSize && sorted.length > 0 && (
        <div className="wmx-datatable__footer">
          <span className="wmx-datatable__summary">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="wmx-datatable__pager">
            <button
              type="button"
              className="wmx-datatable__page-btn"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Prev
            </button>
            <span className="wmx-datatable__page-indicator">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="wmx-datatable__page-btn"
              disabled={currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
