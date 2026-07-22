import Link from 'next/link';
import { brand, colors } from '@challenge42/config';

/**
 * Auth-gated dashboard placeholder. Real authentication + `admin_users` role checks arrive in
 * Phase 10; this scaffold documents the gate rather than exposing any data.
 */
export default function DashboardPage(): React.JSX.Element {
  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>{brand.name.toUpperCase()} · STAFF CONSOLE</p>
        <h1 style={styles.title}>Sign-in required</h1>
        <p style={styles.body}>
          The admin dashboard is gated to authorized staff (Supabase Auth + <code>admin_users</code>{' '}
          role). Authentication and the dashboards land in Phase 10. No participant data is served
          from this scaffold.
        </p>
        <Link href="/" style={styles.back}>
          ← Back
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 },
  card: {
    background: colors.surface.card,
    border: '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-lg)',
    padding: 32,
    maxWidth: 460,
  },
  eyebrow: { color: colors.brand.gold, letterSpacing: 1, fontSize: 12, fontWeight: 700, margin: 0 },
  title: { fontSize: 24, margin: '10px 0 0' },
  body: { color: colors.text.secondary, fontSize: 15, marginTop: 12 },
  back: {
    display: 'inline-block',
    marginTop: 20,
    color: colors.brand.pine,
    fontWeight: 600,
    textDecoration: 'none',
  },
};
