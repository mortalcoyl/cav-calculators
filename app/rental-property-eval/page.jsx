import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "Rental Property vs. Market Investment Calculator";
const description = "Evaluate a rental property against a market investment using purchase price, rent, expenses, appreciation, financing, and long-term return assumptions.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/rental-property-eval"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Rental Property vs. Market Investment Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="rental-property-2" />
    </>
  );
}
