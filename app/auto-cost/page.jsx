import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "New Car vs. Used Car vs. Leased Car Calculator";
const description = "Compare estimated ownership costs for new cars, used cars, and leases, including payments, insurance, maintenance, fuel, depreciation, and invested savings.";

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
          name: "New Car vs. Used Car vs. Leased Car Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="auto-cost" />
    </>
  );
}
