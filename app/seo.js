const siteName = "Financial Calculators";
const socialImage = {
  url: "/financial-calculators-og.png",
  width: 1200,
  height: 630,
  alt: "Financial Calculators for real estate, vehicle, and investment planning",
};

export function socialMetadata(title, description, path = "/", image = socialImage) {
  const url = path;

  return {
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
