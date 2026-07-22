/** Thousands separator without relying on Intl. e.g. 1482 -> "1,482". */
export function formatThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
