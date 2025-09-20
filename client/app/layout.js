// app/layout.js
import './globals.css'; // if you have global styles

export const metadata = {
  title: "Typesto",
  description: "Typing speed test app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-mono">
        {children}
      </body>
    </html>
  );
}
