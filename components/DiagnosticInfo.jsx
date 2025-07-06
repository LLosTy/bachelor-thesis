"use client";

import { useState, useEffect } from "react";
import { testDirectusConnection } from "@/utils/directusConfig";

export const DiagnosticInfo = ({ isVisible = false }) => {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await testDirectusConnection();
      setDiagnosticData(result);
    } catch (error) {
      setDiagnosticData({
        success: false,
        error: error.message,
        config: {
          url: process.env.NEXT_PUBLIC_DIRECTUS_URL || "Not set",
          hasToken: !!process.env.NEXT_PUBLIC_DIRECTUS_TOKEN,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-blue-800">
          Diagnostic Information
        </h3>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Connection"}
        </button>
      </div>

      {diagnosticData && (
        <div className="mt-2 text-xs">
          <div className="space-y-1">
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={
                  diagnosticData.success ? "text-green-600" : "text-red-600"
                }
              >
                {diagnosticData.success ? "Connected" : "Failed"}
              </span>
            </div>

            {diagnosticData.config && (
              <>
                <div>
                  <span className="font-medium">URL:</span>{" "}
                  <span
                    className={
                      diagnosticData.config.url === "http://localhost:8055"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {diagnosticData.config.url}
                  </span>
                  {diagnosticData.config.url === "http://localhost:8055" && (
                    <span className="text-xs text-gray-500 ml-1">
                      (Development)
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Token:</span>{" "}
                  <span
                    className={
                      diagnosticData.config.hasToken
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {diagnosticData.config.hasToken ? "Present" : "Missing"}
                  </span>
                </div>
              </>
            )}

            {diagnosticData.error && (
              <div>
                <span className="font-medium">Error:</span>{" "}
                <span className="text-red-600">{diagnosticData.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
