export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface PageSeoOptions {
  title: string;
  description: string;
  url?: string;
  siteName?: string;
  image?: string;
  robots?: string;
  keywords?: string[];
  locale?: string;
  twitterHandle?: string;
}

export interface PageSeo {
  title: string;
  canonical?: string;
  meta: MetaTag[];
}

export function buildMetaTags(options: PageSeoOptions): MetaTag[] {
  const tags: MetaTag[] = [{ name: "description", content: options.description }];
  if (options.robots) tags.push({ name: "robots", content: options.robots });
  if (options.keywords && options.keywords.length > 0) tags.push({ name: "keywords", content: options.keywords.join(", ") });
  return tags;
}

export function buildOpenGraphTags(options: PageSeoOptions): MetaTag[] {
  const tags: MetaTag[] = [
    { property: "og:type", content: "website" },
    { property: "og:title", content: options.title },
    { property: "og:description", content: options.description },
  ];
  if (options.url) tags.push({ property: "og:url", content: options.url });
  if (options.siteName) tags.push({ property: "og:site_name", content: options.siteName });
  if (options.image) tags.push({ property: "og:image", content: options.image });
  if (options.locale) tags.push({ property: "og:locale", content: options.locale });
  return tags;
}

export function buildTwitterCardTags(options: PageSeoOptions): MetaTag[] {
  const tags: MetaTag[] = [
    { name: "twitter:card", content: options.image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: options.title },
    { name: "twitter:description", content: options.description },
  ];
  if (options.image) tags.push({ name: "twitter:image", content: options.image });
  if (options.twitterHandle) tags.push({ name: "twitter:site", content: options.twitterHandle });
  return tags;
}

export function buildPageSeo(options: PageSeoOptions): PageSeo {
  return {
    title: options.title,
    canonical: options.url,
    meta: [...buildMetaTags(options), ...buildOpenGraphTags(options), ...buildTwitterCardTags(options)],
  };
}
