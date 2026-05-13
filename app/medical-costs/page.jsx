import CombinedRealEstateCalculatorsPreview from "../../components/CombinedRealEstateCalculatorsPreview";
import JsonLd from "../../components/JsonLd";
import { socialMetadata } from "../seo";

const title = "Medical Costs Calculator | Insurance vs. Self-Funded Care";
const description =
  "Compare a yearly invested amount with age-based medical cash costs later in life.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/medical-costs"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Medical Costs Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="medical-costs" />
    </>
  );
}
