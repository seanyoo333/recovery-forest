/**
 * Blog Pagination Component
 *
 * Reusable pagination component for blog posts list.
 * Follows the same pattern as ProductPagination for consistency.
 * Preserves search query and category filters when navigating pages.
 */
import { useSearchParams } from "react-router";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/core/components/ui/pagination";

type BlogPaginationProps = {
  totalPages: number;
};

export function BlogPagination({ totalPages }: BlogPaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";

  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category) params.set("category", category);
    params.set("page", pageNum.toString());
    return `?${params.toString()}`;
  };

  const onClick = (pageNum: number) => {
    searchParams.set("page", pageNum.toString());
    setSearchParams(searchParams);
  };

  if (totalPages <= 1) return null;

  return (
    <div>
      <Pagination>
        <PaginationContent>
          {page === 1 ? null : (
            <>
              <PaginationItem>
                <PaginationPrevious
                  to={buildUrl(page - 1)}
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page - 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  to={buildUrl(page - 1)}
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page - 1);
                  }}
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationLink
              to={buildUrl(page)}
              isActive
              size="default"
              onClick={(event) => {
                event.preventDefault();
                onClick(page);
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
          {page === totalPages ? null : (
            <>
              <PaginationItem>
                <PaginationLink
                  to={buildUrl(page + 1)}
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page + 1);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
              {page + 1 === totalPages ? null : (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  to={buildUrl(page + 1)}
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page + 1);
                  }}
                />
              </PaginationItem>
            </>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
