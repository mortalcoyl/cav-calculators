import CombinedRealEstateCalculatorsPreview from '../components/CombinedRealEstateCalculatorsPreview';
import JsonLd from '../components/JsonLd';
import { socialMetadata } from './seo';

const title = "Financial Calculators for Real Estate, Cars, and Investing";
const description = "Use free planning calculators to compare renting vs. buying, rental property returns, home value vs. market investing, car costs, medical costs, retirement, college savings, and generational savings goals.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Financial Calculators",
          description: metadata.description,
          isAccessibleForFree: true,
          hasPart: [
            { "@type": "WebApplication", name: "Rent vs. Buy Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "Rental Property vs. Market Investment Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "Home Value vs. Market Investment Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "New Car vs. Used Car vs. Leased Car Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "Medical Costs Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "Retirement Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "College Savings Calculator", applicationCategory: "FinanceApplication" },
            { "@type": "WebApplication", name: "Generational Savings Calculator", applicationCategory: "FinanceApplication" },
          ],
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="landing" />
    </>
  );
}
