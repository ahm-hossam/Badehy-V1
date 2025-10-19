import './tailwind.css';
import './globals.css';
import AuthGuard from '../components/auth-guard';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        {/* Skip AuthGuard on auth routes to avoid redirect loops; guard components inside main app pages instead */}
        {children}
      </body>
    </html>
  );
}
