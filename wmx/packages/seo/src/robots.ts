export interface RobotsRule {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
}

export interface RobotsOptions {
  rules: RobotsRule[];
  sitemapUrl?: string;
}

export function generateRobotsTxt(options: RobotsOptions): string {
  const blocks = options.rules.map((rule) => {
    const lines = [`User-agent: ${rule.userAgent}`];
    (rule.allow ?? []).forEach((path) => lines.push(`Allow: ${path}`));
    (rule.disallow ?? []).forEach((path) => lines.push(`Disallow: ${path}`));
    return lines.join("\n");
  });

  const body = blocks.join("\n\n");
  return options.sitemapUrl ? `${body}\n\nSitemap: ${options.sitemapUrl}` : body;
}
