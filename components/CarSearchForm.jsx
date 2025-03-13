"use client";

import { useState, useEffect, useRef } from "react";
import { cookieUtils } from "@/utils/cookieUtils";

export const CarSearchForm = ({ onSearch, loading, initialValue = "" }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    // Only load search history if cookie consent is given
    if (cookieUtils.canUseLocalStorage()) {
      try {
        const savedHistory = localStorage.getItem("carSearchHistory");
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    }
  }, []);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    updateSearchHistory(inputValue);
    onSearch(inputValue);
  };

  const updateSearchHistory = (searchText) => {
    // Only update search history if cookie consent is given
    if (cookieUtils.canUseLocalStorage()) {
      try {
        const filteredHistory = searchHistory.filter(
          (item) => item.toLowerCase() !== searchText.toLowerCase()
        );

        const newHistory = [searchText, ...filteredHistory].slice(0, 6);

        setSearchHistory(newHistory);
        localStorage.setItem("carSearchHistory", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Error updating search history:", error);
      }
    } else {
      // If no consent, just update the in-memory state for the current session
      const filteredHistory = searchHistory.filter(
        (item) => item.toLowerCase() !== searchText.toLowerCase()
      );
      const newHistory = [searchText, ...filteredHistory].slice(0, 6);
      setSearchHistory(newHistory);
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    setInputValue(historyItem);
    textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";

    // Set max height to 150px and enable scrolling if content exceeds this
    if (textarea.scrollHeight > 150) {
      textarea.style.height = "150px";
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflowY = "hidden";
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, [inputValue]);

  return (
    <div
      className="car-search-container my-4 mx-auto"
      style={{ maxWidth: "700px" }}
    >
      <div
        ref={formRef}
        className={`search-form-container rounded-4 p-2 ${
          isFocused ? "shadow-lg" : "shadow"
        }`}
        style={{
          border: `1px solid ${isFocused ? "#10a37f" : "#e0e0e0"}`,
          transition: "all 0.3s ease",
          background: "#ffffff",
        }}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column">
          <textarea
            ref={textareaRef}
            className="form-control border-0 shadow-none custom-scrollbar"
            placeholder="Search for cars (e.g., 'affordable electric SUVs with good range')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              resize: "none",
              fontSize: "16px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              scrollbarWidth: "thin",
              scrollbarColor: "#10a37f #f0f0f0",
            }}
          />

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted ps-2" style={{ fontSize: "12px" }}>
              Press Enter to search
            </small>

            <button
              type="submit"
              className="btn d-flex justify-content-center align-items-center"
              disabled={loading || !inputValue.trim()}
              style={{
                backgroundColor: loading ? "#e0e0e0" : "#10a37f",
                color: "white",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <i className="bi bi-search"></i>
              )}
            </button>
          </div>
        </form>
      </div>

      {searchHistory.length > 0 && (
        <div className="search-history mt-3 px-2">
          <p className="mb-2 text-muted" style={{ fontSize: "14px" }}>
            Recent searches:
          </p>
          <div className="d-flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                className="btn py-1 px-3"
                style={{
                  backgroundColor: "#f7f7f8",
                  border: "1px solid #e0e0e0",
                  borderRadius: "16px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  maxWidth: "200px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onClick={() => handleHistoryItemClick(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
