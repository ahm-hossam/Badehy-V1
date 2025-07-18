import './tailwind.css';
import './globals.css';
import { ApplicationLayout } from '../components/application-layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // TODO: Replace [] with real events data when backend is connected
  return (
    <html lang="en">
      <body>
        <ApplicationLayout events={[]}>
          {children}
        </ApplicationLayout>
      </body>
    </html>
  );
}
