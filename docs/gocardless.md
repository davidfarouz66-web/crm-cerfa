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
NEXTAUTH_URL=https://www.trouma-pro.fr
NEXT_PUBLIC_APP_URL=https://www.trouma-pro.fr
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
vercel env add NEXT_PUBLIC_APP_URL production
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
- Le paiement en plusieurs fois via GoCardless n'est pas encore active dans le code. Le CRM bloque donc les paiements en ligne avec `nbFois > 1` pour eviter d'encaisser un engagement de 6 ou 12 mois en une seule fois.

## Solution prevue pour les vrais paiements en plusieurs fois

GoCardless gere les paiements en plusieurs fois avec un mandat bancaire puis un echeancier d'instalments. C'est le bon modele pour un don de `1200 EUR en 12 fois`, parce que le paiement a une fin claire.

Flux cible :

1. Le donateur choisit par exemple `100 EUR par mois pendant 12 mois`.
2. Le CRM cree une Billing Request GoCardless avec une demande de mandat SEPA, pas une demande de paiement unique.
3. Le donateur valide son mandat dans le flow GoCardless.
4. Au webhook `billing_requests.fulfilled`, le CRM recupere le mandat et cree un instalment schedule GoCardless :
   - montant total : engagement complet, par exemple `120000` centimes
   - devise : `EUR`
   - frequence : `monthly`
   - montants : 12 lignes de `10000` centimes, ou les montants arrondis si la division n'est pas exacte
5. A chaque paiement confirme par webhook GoCardless, le CRM cree un `DonGala` du montant mensuel et l'affiche dans la campagne.
6. Le CERFA est genere uniquement pour les paiements reellement confirmes, jamais pour les mensualites futures.

Donnees a ajouter en base pour cette etape :

- type d'intention GoCardless : paiement unique ou echeancier
- identifiant de mandat GoCardless
- identifiant d'instalment schedule GoCardless
- montant mensuel
- nombre de mensualites prevues
- nombre de mensualites confirmees
- statut de l'echeancier : pending, active, completed, cancelled, failed

Tant que cette etape n'est pas construite, les pages publiques doivent afficher :

- GoCardless : don unique uniquement
- Carte bancaire : don unique uniquement
- Plusieurs mois : disponible en promesse de don, puis a remplacer par le vrai module d'abonnement
