const siteName = "Financial Calculators";
const socialImage = {
  url: "/financial-calculators-og.png",
  width: 1200,
  height: 630,
  alt: "Financial Calculators for real estate, vehicle, and investment planning",
};

export function socialMetadata(title, description) {
  return {
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      locale: "en_US",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}
