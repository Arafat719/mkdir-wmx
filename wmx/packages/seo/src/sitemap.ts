export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const urlBlocks = entries.map((entry) => {
    const lines = [`  <url>`, `    <loc>${escapeXml(entry.url)}</loc>`];
    if (entry.lastModified) {
      const date = entry.lastModified instanceof Date ? entry.lastModified : new Date(entry.lastModified);
      lines.push(`    <lastmod>${date.toISOString().slice(0, 10)}</lastmod>`);
    }
    if (entry.changeFrequency) lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
    if (entry.priority !== undefined) lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    lines.push(`  </url>`);
    return lines.join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urlBlocks,
    `</urlset>`,
  ].join("\n");
}
