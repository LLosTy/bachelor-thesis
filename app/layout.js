import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = {
  title: "Car Search Application",
  description: "Search for cars using natural language",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
