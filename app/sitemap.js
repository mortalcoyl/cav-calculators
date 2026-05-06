const baseUrl = "https://calculators.cavancanavan.com";

export default function sitemap() {
  const routes = [
    "",
    "/rent-vs-buy",
    "/rental-property-eval",
    "/home-value-vs-market",
    "/auto-cost",
    "/college-savings",
    "/generational-savings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
