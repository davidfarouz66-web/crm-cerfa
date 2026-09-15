# Préparation Stripe

Stripe est préparé dans le CRM Cerfa pour pouvoir être connecté plus tard, dès que le compte marchand existe.

## Ce qui est déjà prévu dans le code

- activation du paiement carte depuis `Paramètres > Paiements`
- stockage des clés Stripe dans les réglages du CRM
- création d'une session Stripe Checkout depuis une page de don
- retour donateur vers la page `merci`
- webhook Stripe sur `/api/webhooks/stripe`
- création automatique du don via `checkout.session.completed`

## Ce qu'il faudra renseigner quand le compte Stripe sera créé

Dans `Paramètres > Paiements > Stripe` :

```text
Clé publique      pk_live_...
Clé secrète       sk_live_...
Secret webhook    whsec_...
```

Webhook Stripe à créer dans le dashboard Stripe :

```text
https://www.trouma-pro.fr/api/webhooks/stripe
```

Evénement minimum à envoyer :

```text
checkout.session.completed
```

## Test de validation

1. Activer Stripe dans le CRM.
2. Renseigner les trois clés.
3. Créer ou ouvrir une campagne.
4. Ouvrir le lien public de don.
5. Choisir `Carte bancaire`.
6. Faire un petit paiement test.
7. Vérifier dans le CRM que le don apparaît.
8. Vérifier que le CERFA est généré si le donateur l'a demandé.

## Etat tant que le compte Stripe n'existe pas

Le système peut rester activé côté CRM, mais les paiements carte ne peuvent pas être lancés tant que la clé secrète Stripe n'est pas renseignée.
