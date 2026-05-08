import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../../components/JsonLd';
import { socialMetadata } from '../seo';

const title = "Retirement Calculator | Savings, Spending, and Tax Bracket";
const description = "Project retirement savings, annual contributions, inflation-adjusted spending, retirement returns, and an auto-filled 2025 federal tax bracket.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/retirement"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Retirement Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="retirement" />
    </>
  );
}
