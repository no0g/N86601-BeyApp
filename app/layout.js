import "./globals.css";

export const metadata = {
  title: "N86601 BeyApp",
  description: "Beyblade X combo builder, deck planner, and tournament tracker."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
