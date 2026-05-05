import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "Rent vs. Buy Calculator | Compare Renting and Buying a Home";
const description = "Estimate whether renting or buying may be better based on home price, rent, mortgage rate, taxes, maintenance, appreciation, and investment returns.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/rent-vs-buy"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Rent vs. Buy Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="rent-vs-buy" />
    </>
  );
}
