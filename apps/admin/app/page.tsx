import Link from 'next/link';
import { brand, colors } from '@challenge42/config';

interface Capability {
  title: string;
  description: string;
  phase: string;
}

const CAPABILITIES: Capability[] = [
  {
    title: 'Challenges',
    description: 'Create challenges, edit dates, manage the lifecycle.',
    phase: 'Phase 10',
  },
  {
    title: 'Users & members',
    description: 'Manage participants, view participation, spot at-risk members.',
    phase: 'Phase 10',
  },
  {
    title: 'Teams',
    description: 'Create teams, move participants, balance rosters.',
    phase: 'Phase 10',
  },
  {
    title: 'Moderation',
    description: 'Review reported posts and comments; hide or resolve.',
    phase: 'Phase 10',
  },
  {
    title: 'Meal templates & recipes',
    description: 'Curate recipes and meal templates; review AI meal-plan issues.',
    phase: 'Phase 10',
  },
  {
    title: 'Success stories & consent',
    description: 'Manage alumni stories and per-surface consent (in-app / web / marketing).',
    phase: 'Phase 10',
  },
  {
    title: 'Notifications',
    description: 'Compose and send push notifications to segments.',
    phase: 'Phase 10',
  },
  {
    title: 'Analytics',
    description: 'Participation, retention, and aggregate results.',
    phase: 'Phase 10',
  },
];

export default function AdminHome(): React.JSX.Element {
  return (
    <main>
      <header style={styles.bar}>
        <div style={styles.lockup}>
          <span style={styles.brandMark}>{brand.name.toUpperCase()}</span>
          <span style={styles.brandSub}>Staff Console</span>
        </div>
        <Link href="/dashboard" style={styles.signIn}>
          Sign in →
        </Link>
      </header>

      <section style={styles.hero}>
        <p style={styles.eyebrow}>INTERNAL · AUTHORIZED STAFF ONLY</p>
        <h1 className="serif" style={styles.title}>
          Run the challenge behind the scenes.
        </h1>
        <p style={styles.lede}>
          This is the {brand.name} admin scaffold. Phase One establishes the architecture and
          security boundaries; the dashboards below arrive in Phase 10. Privileged actions run only
          on the server with the service role — never in the browser.
        </p>
      </section>

      <section style={styles.grid}>
        {CAPABILITIES.map((c) => (
          <article key={c.title} style={styles.card}>
            <div style={styles.cardTop}>
              <h2 style={styles.cardTitle}>{c.title}</h2>
              <span style={styles.pill}>{c.phase}</span>
            </div>
            <p style={styles.cardDesc}>{c.description}</p>
          </article>
        ))}
      </section>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Security: admin uses the Supabase service role in server code only. Every privileged
          action is authorized by <code>is_admin()</code> in RLS and app-level role checks (defense
          in depth). See <code>docs/SECURITY.md</code>.
        </p>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: colors.surface.pine,
    color: colors.text.onPine,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
  },
  lockup: { display: 'flex', flexDirection: 'column', gap: 2 },
  brandMark: { color: colors.brand.gold, letterSpacing: 1, fontSize: 12, fontWeight: 700 },
  brandSub: { fontSize: 15, color: 'rgba(247,243,232,0.72)' },
  signIn: { color: colors.text.onPine, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  hero: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '56px 24px 24px' },
  eyebrow: { color: '#8A6D2B', letterSpacing: 1, fontSize: 12, fontWeight: 700, margin: 0 },
  title: { fontSize: 40, lineHeight: 1.1, margin: '12px 0 0', maxWidth: 640 },
  lede: { color: colors.text.secondary, fontSize: 18, maxWidth: 620, marginTop: 16 },
  grid: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '16px 24px 40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: colors.surface.card,
    border: '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 17, margin: 0 },
  pill: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.text.secondary,
    background: 'var(--sunken)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)',
  },
  cardDesc: { color: colors.text.secondary, fontSize: 14, marginTop: 8, marginBottom: 0 },
  footer: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '0 24px 56px',
  },
  footerText: {
    color: colors.text.tertiary,
    fontSize: 13,
    borderTop: '1px solid var(--border-hairline)',
    paddingTop: 16,
  },
};
