import CombinedRealEstateCalculatorsPreview from "../../components/CombinedRealEstateCalculatorsPreview";
import JsonLd from "../../components/JsonLd";
import { socialMetadata } from "../seo";

const title = "College Savings Calculator";
const description =
  "Project college savings for one or more children, including starting balances, monthly contributions, index return assumptions, education inflation, and July tuition plus board withdrawals.";

export const metadata = {
  title,
  description,
  ...socialMetadata(title, description, "/college-savings"),
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "College Savings Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          isAccessibleForFree: true,
          description: metadata.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <CombinedRealEstateCalculatorsPreview initialCalculator="college-savings" />
    </>
  );
}
