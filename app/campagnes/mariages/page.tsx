import PublicCampaignCategoryPage from "../_components/PublicCampaignCategoryPage";

export default function MariagesPublicPage() {
  return (
    <PublicCampaignCategoryPage
      config={{
        type: "mariage",
        title: "Aider un mariage",
        subtitle: "Participez aux campagnes qui aident des couples a construire leur foyer avec dignite.",
        emptyText: "Aucune campagne mariage active pour le moment.",
      }}
    />
  );
}
