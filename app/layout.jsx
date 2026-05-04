export const metadata = {
  title: "Real Estate Calculators",
  description: "Rent vs buy, rental property, home value, auto cost, and BaT calculators.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
