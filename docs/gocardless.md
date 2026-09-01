# Connexion GoCardless

L'integration GoCardless est deja presente dans le CRM Cerfa :

- connexion OAuth depuis `Parametres > Paiements`
- creation d'un lien de paiement bancaire depuis une page de don gala
- reception des webhooks GoCardless
- creation automatique du don et du CERFA apres paiement confirme

## Variables a configurer

Dans Vercel ou Railway, ajoute :

```bash
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_CLIENT_ID=...
GOCARDLESS_CLIENT_SECRET=...
GOCARDLESS_OAUTH_STATE_SECRET=une-valeur-longue-aleatoire
GOCARDLESS_WEBHOOK_ENDPOINT_SECRET=...
NEXTAUTH_URL=https://ton-domaine
```

En sandbox, mets `GOCARDLESS_ENVIRONMENT=sandbox` et utilise les identifiants de l'app sandbox.

Pour un compte GoCardless marchand standard sans app OAuth partenaire, configure plutot un jeton direct :

```bash
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_ACCESS_TOKEN=...
GOCARDLESS_WEBHOOK_ENDPOINT_SECRET=...
NEXTAUTH_URL=https://ton-domaine
```

### Vercel

Le projet local est deja lie au projet Vercel `crm-cerfa`. Depuis ce dossier, tu peux ajouter les variables avec :

```bash
vercel env add GOCARDLESS_ENVIRONMENT production
vercel env add GOCARDLESS_ACCESS_TOKEN production
vercel env add GOCARDLESS_CLIENT_ID production
vercel env add GOCARDLESS_CLIENT_SECRET production
vercel env add GOCARDLESS_OAUTH_STATE_SECRET production
vercel env add GOCARDLESS_WEBHOOK_ENDPOINT_SECRET production
vercel env add NEXTAUTH_URL production
```

Puis redeploie l'application.

### Railway

Si tu deploies par Railway, ajoute les memes variables dans `Variables` du service. La migration Prisma GoCardless existe deja dans `prisma/migrations/20260827153000_add_gocardless_connections`.

## Reglages cote GoCardless

Dans le dashboard GoCardless, cree une app partenaire OAuth puis renseigne exactement ces URLs :

```text
Redirect URL:
https://ton-domaine/api/gocardless/callback

Webhook URL:
https://ton-domaine/api/webhooks/gocardless
```

Le `Redirect URL` doit correspondre exactement a l'URL utilisee par l'application, sinon GoCardless refusera la connexion OAuth.

## Connexion dans le CRM

1. Deploie l'application avec les variables ci-dessus.
2. Verifie que la migration Prisma a ete appliquee en production.
3. Connecte-toi au CRM en admin de l'association.
4. Va dans `Parametres > Paiements`.
5. Active GoCardless.
6. Clique sur `Connecter GoCardless`.
7. Connecte le compte GoCardless de l'association et autorise l'app.

Une fois reconnecte au CRM, le statut doit afficher `Compte GoCardless connecte`.

## Notes importantes

- Ne mets jamais les secrets GoCardless dans le code.
- Le webhook cree le don uniquement lorsque le paiement est confirme ou paye, afin d'eviter d'emettre un CERFA avant paiement reel.
- Le paiement en plusieurs fois via GoCardless n'est pas encore active dans le code.
