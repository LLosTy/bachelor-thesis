export const cookieUtils = {
  getConsentPreferences() {
    try {
      const savedPreferences = localStorage.getItem("cookieConsent");
      return savedPreferences ? JSON.parse(savedPreferences) : null;
    } catch (error) {
      console.error("Error reading cookie preferences:", error);
      return null;
    }
  },

  canUseLocalStorage() {
    const preferences = this.getConsentPreferences();
    return preferences?.functional === true;
  },
};
