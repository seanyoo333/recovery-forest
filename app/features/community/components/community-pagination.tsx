/**
 * Community post list pagination — mirrors `BlogPagination` / `ProductPagination` patterns.
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

type CommunityPaginationProps = {
  totalPages: number;
};

export function CommunityPagination({ totalPages }: CommunityPaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);

  const setPage = (pageNum: number) => {
    const next = new URLSearchParams(searchParams);
    if (pageNum <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(pageNum));
    }
    setSearchParams(next);
  };

  const buildHref = (pageNum: number) => {
    const next = new URLSearchParams(searchParams);
    if (pageNum <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(pageNum));
    }
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  const onClick = (pageNum: number) => {
    setPage(pageNum);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center pt-4">
      <Pagination>
        <PaginationContent>
          {page === 1 ? null : (
            <>
              <PaginationItem>
                <PaginationPrevious
                  to={buildHref(page - 1)}
                  size="default"
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page - 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  to={buildHref(page - 1)}
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
              to={buildHref(page)}
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
                  to={buildHref(page + 1)}
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
                  to={buildHref(page + 1)}
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
