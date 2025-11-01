import type { Metadata } from "next";
import "./globals.css";
import { PersistTokens } from '../components/persist-tokens';

export const metadata: Metadata = {
  title: "Badehy - Client Portal",
  description: "Your fitness journey starts here",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler to catch JSON parse errors
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('JSON Parse error')) {
                  console.error('[Global] Caught JSON parse error:', e.message);
                  // Don't show to user, just log it
                  e.preventDefault();
                  return false;
                }
              });
              
              // Catch unhandled promise rejections (from async JSON parsing)
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && (e.reason.message && e.reason.message.includes('JSON') || e.reason.message && e.reason.message.includes('token'))) {
                  console.error('[Global] Caught unhandled JSON error:', e.reason);
                  e.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <PersistTokens />
        {children}
      </body>
    </html>
  );
}

