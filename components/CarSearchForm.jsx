"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cookieUtils } from "@/utils/cookieUtils";

export function CarSearchForm({ onSearch, loading, initialValue = "" }) {
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
    <div className="my-4 mx-auto max-w-[700px]">
      <div
        ref={formRef}
        className={`rounded-xl p-2 bg-white transition-all duration-300 ${
          isFocused ? "shadow-lg border-[#10a37f]" : "shadow border-[#e0e0e0]"
        }`}
        style={{
          border: "1px solid",
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Textarea
            ref={textareaRef}
            className="border-0 shadow-none resize-none text-base font-sans scrollbar-thin scrollbar-thumb-[#10a37f] scrollbar-track-[#f0f0f0] focus-visible:ring-0 p-0 min-h-[42px]"
            placeholder="Search for cars (e.g., 'affordable electric SUVs with good range')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            style={{
              height: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#10a37f #f0f0f0",
            }}
          />

          <div className="flex justify-between items-center mt-2">
            <small className="text-muted-foreground text-xs pl-2">
              Press Enter to search
            </small>

            <Button
              type="submit"
              size="icon"
              className="w-9 h-9 rounded-lg bg-[#10a37f] hover:bg-[#0d8b6a] disabled:bg-[#e0e0e0]"
              disabled={loading || !inputValue.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </form>
      </div>

      {searchHistory.length > 0 && (
        <div className="mt-3 px-2">
          <p className="mb-2 text-muted-foreground text-sm">Recent searches:</p>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <Badge
                key={index}
                variant="outline"
                className="py-1 px-3 cursor-pointer bg-[#f7f7f8] hover:bg-[#e9e9eb] border border-[#e0e0e0] text-sm transition-all duration-200 max-w-[200px] truncate font-normal"
                onClick={() => handleHistoryItemClick(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
