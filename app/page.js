"use client";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function TextInputComponent() {
  const [inputValue, setInputValue] = useState("");
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that converts natural language queries about cars into JSON filters.
                     For "affordable cars", return a filter for cars under $30,000.
                     Only respond with the JSON filter object, nothing else.
                     Example format: {"price": {"_lte": 30000}}`,
          },
          { role: "user", content: inputValue },
        ],
      });

      const filter = JSON.parse(completion.choices[0].message.content);
      console.log("filter:", filter);

      const response = await fetch(
        `http://localhost:8055/items/CarListings?filter=${JSON.stringify(
          filter
        )}`
      );
      const data = await response.json();
      console.log("API Response:", data);
      setCarListings(data.data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="d-flex align-items-center gap-2 mb-3"
        style={{ maxWidth: "320px" }}
      >
        <textarea
          type="text"
          className="form-control"
          placeholder="Search cars (e.g., 'affordable cars')"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {carListings && carListings.length > 0 && (
        <div className="mt-3 container">
          <div className="row">
            {carListings.map((car) => (
              <div key={car.id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                      {car.make} {car.model}
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {carListings && carListings.length === 0 && !loading && (
        <div className="mt-3 alert alert-info">
          No cars found matching your criteria.
        </div>
      )}
    </div>
  );
}
