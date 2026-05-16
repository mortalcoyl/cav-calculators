import CombinedRealEstateCalculatorsPreview from "../../components/CombinedRealEstateCalculatorsPreview";
import JsonLd from "../../components/JsonLd";
import { socialMetadata } from "../seo";

const title = "GenWiz";
const description =
  "Answer conversational prompts to build a generational savings plan for children, education, cars, home down payments, and family investment goals.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/genwiz"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "GenWiz",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="genwiz" />
    </>
  );
}
