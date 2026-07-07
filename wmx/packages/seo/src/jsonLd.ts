export function buildJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify({ "@context": "https://schema.org", ...schema }, null, 2);
}

export interface ArticleSchemaOptions {
  headline: string;
  description: string;
  authorName: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url?: string;
}

export function buildArticleSchema(options: ArticleSchemaOptions): Record<string, unknown> {
  return {
    "@type": "Article",
    headline: options.headline,
    description: options.description,
    author: { "@type": "Person", name: options.authorName },
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    ...(options.image ? { image: options.image } : {}),
    ...(options.url ? { url: options.url } : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface OrganizationSchemaOptions {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

export function buildOrganizationSchema(options: OrganizationSchemaOptions): Record<string, unknown> {
  return {
    "@type": "Organization",
    name: options.name,
    url: options.url,
    ...(options.logo ? { logo: options.logo } : {}),
    ...(options.sameAs && options.sameAs.length > 0 ? { sameAs: options.sameAs } : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
