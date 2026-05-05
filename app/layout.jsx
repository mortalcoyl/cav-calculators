export const metadata = {
  metadataBase: new URL("https://calculators.cavancanavan.com"),
  title: "Real Estate Calculators",
  description: "Rent vs buy, rental property, home value, and auto cost calculators.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
