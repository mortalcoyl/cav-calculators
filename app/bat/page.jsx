import CombinedRealEstateCalculatorsPreview from "../../components/CombinedRealEstateCalculatorsPreview";
import JsonLd from "../../components/JsonLd";
import { socialMetadata } from "../seo";

const title = "Bring a Trailer Decision Calculator";
const description =
  "Use a simple Bring a Trailer planning calculator to compare your available cash against the price of a potential vehicle purchase.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Bring a Trailer Decision Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="bat" />
    </>
  );
}
