import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "Home Value vs. Market Investment Calculator";
const description = "Compare the estimated outcome of buying and selling a home against investing the same money in the market over time.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/home-value-vs-market"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Home Value vs. Market Investment Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="home-value" />
    </>
  );
}
