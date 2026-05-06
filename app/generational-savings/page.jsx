import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "Generational Savings Calculator";
const description = "Plan savings for kids' cars, college, postgraduate degrees, and home down payments using current costs, inflation, market return assumptions, and monthly contributions.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/generational-savings"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Generational Savings Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="generational-savings" />
    </>
  );
}
