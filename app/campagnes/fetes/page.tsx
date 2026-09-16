import PublicCampaignCategoryPage from "../_components/PublicCampaignCategoryPage";

export const dynamic = "force-dynamic";

export default function FetesPublicPage() {
  return (
    <PublicCampaignCategoryPage
      config={{
        type: "fetes",
        title: "Aider pour les fetes",
        subtitle: "Soutenez les familles pour preparer les fetes avec nourriture, vetements et dignite.",
        emptyText: "Aucune campagne fetes active pour le moment.",
      }}
    />
  );
}
