import CombinedRealEstateCalculatorsPreview from '../components/CombinedRealEstateCalculatorsPreview';

export const metadata = {
  title: "Real Estate Calculators",
};

export default function Page() {
  return <CombinedRealEstateCalculatorsPreview initialCalculator="landing" />;
}
