import PublicCampaignCategoryPage from "../_components/PublicCampaignCategoryPage";

export const dynamic = "force-dynamic";

export default function OrphelinsPublicPage() {
  return (
    <PublicCampaignCategoryPage
      config={{
        type: "orphelin",
        title: "Soutenir les orphelins",
        subtitle: "Aidez a couvrir les besoins essentiels, la scolarite et l'accompagnement des enfants.",
        emptyText: "Aucune campagne orphelins active pour le moment.",
      }}
    />
  );
}
