import CombinedRealEstateCalculatorsPreview from '../../components/CombinedRealEstateCalculatorsPreview';

export const metadata = {
  title: "Renting vs. Buying",
};

export default function Page() {
  return <CombinedRealEstateCalculatorsPreview initialCalculator="rent-vs-buy" />;
}
