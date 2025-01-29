import { useState } from "react";

export const CarSearchForm = ({ onSearch, loading }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex gap-2 mb-4">
      <textarea
        className="form-control"
        placeholder="Search cars (e.g., 'affordable cars')"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
};
