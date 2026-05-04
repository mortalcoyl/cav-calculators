import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';

export const metadata = {
  title: "Home Value vs. Market Investment",
};

export default function Page() {
  return <CombinedRealEstateCalculatorsPreview initialCalculator="home-value" />;
}
