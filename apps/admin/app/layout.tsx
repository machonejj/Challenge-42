import type { Metadata } from 'next';
import { brand } from '@challenge42/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${brand.name} · Staff Console`,
  description: `Internal admin console for ${brand.name}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
