import PublicCampaignCategoryPage from "../_components/PublicCampaignCategoryPage";

export const dynamic = "force-dynamic";

export default function UrgencesPublicPage() {
  return (
    <PublicCampaignCategoryPage
      config={{
        type: "urgence",
        title: "Repondre aux urgences",
        subtitle: "Participez aux campagnes prioritaires pour les loyers, soins, factures et situations critiques.",
        emptyText: "Aucune campagne urgence active pour le moment.",
      }}
    />
  );
}
