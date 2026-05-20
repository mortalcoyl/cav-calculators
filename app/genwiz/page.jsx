import CombinedRealEstateCalculatorsPreview from "../../components/CombinedRealEstateCalculatorsPreview";
import JsonLd from "../../components/JsonLd";
import { socialMetadata } from "../seo";

const title = "GenWiz";
const description =
  "Answer conversational prompts to build a generational savings plan for children, education, cars, home down payments, and family investment goals.";
const socialImage = {
  url: "/genwiz-og.png",
  width: 1200,
  height: 630,
  alt: "GenWiz generational savings planning wizard for family financial goals",
};

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/genwiz", socialImage),
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
