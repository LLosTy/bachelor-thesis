"use client";

import { useState, useEffect, useRef } from "react";

export const CarSearchForm = ({ onSearch, loading, initialValue = "" }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showArrows, setShowArrows] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    updateSearchHistory(inputValue);
    onSearch(inputValue);
  };

  const updateSearchHistory = (searchText) => {
    try {
      const filteredHistory = searchHistory.filter(
        (item) => item.toLowerCase() !== searchText.toLowerCase()
      );

      const newHistory = [searchText, ...filteredHistory].slice(0, 10);

      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error updating search history:", error);
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    // Only set the input value, don't update history
    setInputValue(historyItem);
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const container = scrollContainerRef.current;
      const newScrollPosition =
        container.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="car-search-container">
      <form onSubmit={handleSubmit} className="d-flex gap-2 mb-3">
        <textarea
          className="form-control"
          placeholder="Search cars (e.g., 'affordable cars')"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          rows={3}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {searchHistory.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-muted small">Recent searches:</p>
          <div
            className="position-relative"
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
          >
            {/* Left Arrow */}
            <button
              className={`btn btn-sm btn-light rounded-circle position-absolute left-arrow ${
                !showArrows ? "hidden" : "visible"
              }`}
              onClick={() => scroll("left")}
              style={{
                width: "32px",
                height: "32px",
                padding: "0",
                zIndex: 1,
                left: "0",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "white",
              }}
            >
              ←
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="d-flex gap-2"
              style={{
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "0 40px", // Make space for the arrows
              }}
            >
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  className="btn btn-outline-secondary rounded-pill text-truncate flex-shrink-0"
                  style={{
                    maxWidth: "200px",
                    minWidth: "100px",
                    whiteSpace: "nowrap",
                    border: "1px solid #dee2e6",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleHistoryItemClick(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              className={`btn btn-sm btn-light rounded-circle position-absolute right-arrow ${
                !showArrows ? "hidden" : "visible"
              }`}
              onClick={() => scroll("right")}
              style={{
                width: "32px",
                height: "32px",
                padding: "0",
                zIndex: 1,
                right: "0",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "white",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          /* Hide scrollbar for Chrome, Safari and Opera */
          div::-webkit-scrollbar {
            display: none;
          }
          
          /* Hover effect for pills */
          .btn.btn-outline-secondary:hover {
            background-color: #f8f9fa;
            border-color: #6c757d;
          }
          
          /* Arrow animations */
          .left-arrow.hidden {
            opacity: 0;
            transform: translateY(-50%) translateX(-100%);
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          
          .left-arrow.visible {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          
          .right-arrow.hidden {
            opacity: 0;
            transform: translateY(-50%) translateX(100%);
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          
          .right-arrow.visible {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
        `}
      </style>
    </div>
  );
};
