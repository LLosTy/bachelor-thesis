"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const PaginationControls = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) => {
  // Validate inputs
  const validCurrentPage = Math.max(
    1,
    Math.min(totalPages, Number(currentPage) || 1)
  );
  const validTotalPages = Math.max(1, Number(totalPages) || 1);

  // Don't show pagination if there's only one page
  if (validTotalPages <= 1) return null;

  // Helper function to handle page change safely
  const handlePageChange = useCallback(
    (page) => {
      if (typeof onPageChange === "function") {
        // Ensure page is within valid range
        const validPage = Math.max(1, Math.min(validTotalPages, page));

        // Only call if the page is different from current
        if (validPage !== validCurrentPage) {
          onPageChange(validPage);
        }
      } else {
        console.error("PaginationControls: onPageChange is not a function");
      }
    },
    [onPageChange, validCurrentPage, validTotalPages]
  );

  // Function to check if there are more pages
  const hasMorePages = useCallback(() => {
    return validCurrentPage < validTotalPages;
  }, [validCurrentPage, validTotalPages]);

  // Function to generate page links for pagination
  const generatePageLinks = useCallback(() => {
    // Define how many page numbers to show
    const maxPageLinks = 5;
    let startPage = Math.max(
      1,
      validCurrentPage - Math.floor(maxPageLinks / 2)
    );
    let endPage = Math.min(validTotalPages, startPage + maxPageLinks - 1);

    // Adjust start page if end page is at maximum
    if (endPage === validTotalPages) {
      startPage = Math.max(1, endPage - maxPageLinks + 1);
    }

    const pageItems = [];

    // Add first page if not in range
    if (startPage > 1) {
      pageItems.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );

      // Add ellipsis if there's a gap
      if (startPage > 2) {
        pageItems.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === validCurrentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add last page if not in range
    if (endPage < validTotalPages) {
      // Add ellipsis if there's a gap
      if (endPage < validTotalPages - 1) {
        pageItems.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      pageItems.push(
        <PaginationItem key={validTotalPages}>
          <PaginationLink onClick={() => handlePageChange(validTotalPages)}>
            {validTotalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pageItems;
  }, [handlePageChange, validCurrentPage, validTotalPages]);

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* Previous button */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(validCurrentPage - 1)}
            className={
              validCurrentPage <= 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            aria-disabled={validCurrentPage <= 1}
          />
        </PaginationItem>

        {/* Page numbers */}
        {generatePageLinks()}

        {/* Next button */}
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              handlePageChange(
                hasMorePages() ? validCurrentPage + 1 : validCurrentPage
              )
            }
            className={
              !hasMorePages()
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            aria-disabled={!hasMorePages()}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
