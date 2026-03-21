import "./globals.css";

const themeScript = `
  (function () {
    try {
      var storedTheme = localStorage.getItem("n86601-theme");
      var preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var theme = storedTheme || preferredTheme;
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {}
  })();
`;

export const metadata = {
  title: "N86601 BeyApp",
  description: "Beyblade X combo builder, deck planner, and tournament tracker."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
