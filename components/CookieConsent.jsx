"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  // Initialize state from localStorage only once
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPreferences = localStorage.getItem("cookieConsent");
        if (!savedPreferences) {
          setShowBanner(true);
        } else {
          setPreferences(JSON.parse(savedPreferences));
          // Do not show banner if preferences exist
          setShowBanner(false);
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      } finally {
        // Mark as initialized regardless of outcome
        setIsInitialized(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookieConsent", JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieConsent", JSON.stringify(preferences));
    setShowBanner(false);
  };

  // Return null until initialization is complete to prevent flashing
  if (!isInitialized) {
    return null;
  }

  // If banner should not be shown and modal is not needed, return null
  if (!showBanner) {
    return (
      // Only keep the modal in the DOM for when users might need to access it later
      <div
        className="modal fade"
        id="cookieModal"
        tabIndex={-1}
        aria-labelledby="cookieModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title" id="cookieModalLabel">
                Cookie Settings
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-muted small mb-4">
                We use cookies to enhance your browsing experience and analyze
                our traffic. Please choose your preferences below.
              </p>

              <div className="d-flex flex-column gap-4">
                {/* Essential Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="essential"
                    checked={preferences.essential}
                    disabled
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="essential"
                  >
                    <span className="fw-medium">Essential Cookies</span>
                    <small className="text-muted">
                      Required for the website to function properly
                    </small>
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="functional"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        functional: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="functional"
                  >
                    <span className="fw-medium">Functional Cookies</span>
                    <small className="text-muted">
                      Enhance website functionality and personalization
                    </small>
                  </label>
                </div>

                {/* Analytics Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        analytics: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="analytics"
                  >
                    <span className="fw-medium">Analytics Cookies</span>
                    <small className="text-muted">
                      Help us understand how visitors interact with the website
                    </small>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        marketing: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="marketing"
                  >
                    <span className="fw-medium">Marketing Cookies</span>
                    <small className="text-muted">
                      Used to deliver personalized advertisements
                    </small>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleSavePreferences}
                data-bs-dismiss="modal"
              >
                Accept selected
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAcceptAll}
                data-bs-dismiss="modal"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Initial Banner - Centered and Floating */}
      <div
        className="position-fixed shadow-lg rounded-3 bg-white"
        style={{
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1040,
          maxWidth: "90%",
          width: "auto",
        }}
      >
        <div className="p-4">
          <p className="text-center fw-light mb-3">
            Will you allow us to use cookies?
          </p>
          <div className="d-flex gap-3">
            <button
              className="btn btn-sm btn-primary px-4"
              onClick={handleAcceptAll}
            >
              Allow cookies
            </button>
            <button
              className="btn btn-sm btn-outline-secondary px-4"
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#cookieModal"
            >
              Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Bootstrap 5 Modal */}
      <div
        className="modal fade"
        id="cookieModal"
        tabIndex={-1}
        aria-labelledby="cookieModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title" id="cookieModalLabel">
                Cookie Settings
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-muted small mb-4">
                We use cookies to enhance your browsing experience and analyze
                our traffic. Please choose your preferences below.
              </p>

              <div className="d-flex flex-column gap-4">
                {/* Essential Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="essential"
                    checked={preferences.essential}
                    disabled
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="essential"
                  >
                    <span className="fw-medium">Essential Cookies</span>
                    <small className="text-muted">
                      Required for the website to function properly
                    </small>
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="functional"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        functional: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="functional"
                  >
                    <span className="fw-medium">Functional Cookies</span>
                    <small className="text-muted">
                      Enhance website functionality and personalization
                    </small>
                  </label>
                </div>

                {/* Analytics Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        analytics: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="analytics"
                  >
                    <span className="fw-medium">Analytics Cookies</span>
                    <small className="text-muted">
                      Help us understand how visitors interact with the website
                    </small>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        marketing: e.target.checked,
                      })
                    }
                  />
                  <label
                    className="form-check-label d-flex flex-column"
                    htmlFor="marketing"
                  >
                    <span className="fw-medium">Marketing Cookies</span>
                    <small className="text-muted">
                      Used to deliver personalized advertisements
                    </small>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleSavePreferences}
                data-bs-dismiss="modal"
              >
                Accept selected
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAcceptAll}
                data-bs-dismiss="modal"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom modal backdrop style */}
      <style jsx global>{`
        .modal-backdrop.show {
          backdrop-filter: blur(4px);
          background-color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </>
  );
}
