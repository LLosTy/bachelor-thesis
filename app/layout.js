import "bootstrap/dist/css/bootstrap.min.css";
import BootstrapClient from "@/components/BootstrapClient";
import CookieConsent from "@/components/CookieConsent";
import "bootstrap-icons/font/bootstrap-icons.css";

export const metadata = {
  title: "Car Search Application",
  description: "Search for cars using natural language",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapClient />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
