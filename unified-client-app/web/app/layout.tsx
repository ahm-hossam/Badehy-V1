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
      </head>
      <body className="antialiased">
        <PersistTokens />
        {children}
      </body>
    </html>
  );
}

