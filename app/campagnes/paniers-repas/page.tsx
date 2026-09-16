import PublicCampaignCategoryPage from "../_components/PublicCampaignCategoryPage";

export const dynamic = "force-dynamic";

export default function PaniersRepasPublicPage() {
  return (
    <PublicCampaignCategoryPage
      config={{
        type: "panier_repas",
        title: "Offrir des paniers repas",
        subtitle: "Financez des paniers alimentaires pour les familles qui en ont besoin, avant chabbat ou les periodes de fete.",
        emptyText: "Aucune campagne paniers repas active pour le moment.",
      }}
    />
  );
}
