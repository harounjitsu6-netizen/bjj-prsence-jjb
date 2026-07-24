# Présences club

Application de suivi des présences pour un club de sport : on inscrit les adhérents
avec leur **catégorie** (Enfant, Adolescent, Adulte), on fait l'appel en quelques
secondes, et l'application produit le classement d'assiduité **par mois** et **par
saison**, filtrable par catégorie.

- Deux statuts par adhérent et par séance : **présent** ou **absent**
- **Catégories** Enfant / Adolescent / Adulte à l'inscription
- **Filtres par catégorie** sur l'appel, la liste et les statistiques
- Bouton « Tout présent » qui n'agit que sur la catégorie affichée
- Classement avec rang, taux de présence, présences et absences
- Registre visuel : une case par séance et par adhérent
- Fiche individuelle avec le détail mois par mois
- Export CSV du classement (ouvrable dans Excel) et sauvegarde JSON

## Règle de calcul du taux (importante)

Le taux de présence se calcule **uniquement sur les séances où un statut a été
validé** pour l'adhérent :

```
taux = présences ÷ (présences + absences)
```

Une séance où l'on ne coche rien pour un adhérent n'entre pas du tout dans son
calcul, même si d'autres adhérents ont été cochés ce jour-là. Un adhérent inscrit
en cours de saison n'est donc jamais pénalisé pour les séances antérieures.

## Où sont stockées les données

Dans le **stockage local du navigateur** (`localStorage`). Aucun serveur, aucune base
de données, aucun compte : le projet se déploie tel quel. En contrepartie, les données
sont propres à un navigateur et à un appareil — d'où les boutons *Exporter la
sauvegarde* et *Restaurer un fichier* dans l'onglet **Adhérents**.

Les anciennes sauvegardes de la version « cahier d'appel » restent lisibles : les
adhérents sont repris (catégorie **Adulte** par défaut) et les anciens statuts
« retard » sont convertis en « présent ».

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Déployer sur Vercel

Projet Next.js standard, sans variable d'environnement. Vercel le détecte tout seul.

**Depuis un dépôt Git**

1. `git init && git add . && git commit -m "Présences club"`
2. Pousser le dépôt, puis sur vercel.com : *Add New… → Project*, importer, *Deploy*.

**Depuis le terminal**

```bash
npm i -g vercel
vercel          # aperçu
vercel --prod   # production
```

## Structure du projet

```
.
├── app/
│   ├── layout.js                 Structure HTML, polices, fournisseur de données
│   ├── globals.css               Tout le style (aucun framework CSS)
│   ├── page.js                   Appel du jour + filtre par catégorie
│   ├── adherents/page.js         Effectif, inscription, catégories, sauvegardes
│   ├── adherents/[id]/page.js    Fiche adhérent, détail mois par mois
│   └── statistiques/page.js      Classement mensuel et saison + registre
├── components/
│   ├── BarreNavigation.jsx
│   ├── FiltreCategories.jsx      Barre de filtres Toutes / Enfant / Ado / Adulte
│   ├── SelecteurEtat.jsx         Bouton présent / absent
│   ├── TableauClassement.jsx
│   └── GrilleAssiduite.jsx       Une case par séance
├── lib/
│   ├── store.jsx                 Contexte React + persistance localStorage + migration
│   ├── stats.js                  Calcul des taux et du classement
│   ├── categories.js             Catégories d'adhérents
│   ├── dates.js                  Dates en français, saison sportive
│   └── fichiers.js               Export CSV et sauvegarde JSON
├── next.config.mjs
└── package.json
```

## Format des données

```json
{
  "version": 2,
  "adherents": [
    { "id": "…", "nom": "Chevalier", "prenom": "Alice", "categorie": "enfant" }
  ],
  "presences": {
    "2026-01-12": { "id-de-l-adherent": "present" }
  }
}
```

Statuts possibles : `present`, `absent`. Catégories : `enfant`, `ado`, `adulte`.

## Personnaliser

- **Catégories** : la liste est dans `lib/categories.js`. Ajouter, renommer ou
  réordonner s'y fait en un endroit ; les filtres et les formulaires suivent.
- **Couleurs et polices** : variables en haut de `app/globals.css` (`:root`).
- **Saison sportive** : fixée du 1er septembre au 31 août dans `lib/dates.js`
  (`saisonDeIso`). Pour l'année civile, y renvoyer janvier–décembre.

## Passer à une base de données

Toute la persistance est isolée dans `lib/store.jsx`. Pour partager les données entre
plusieurs entraîneurs ou appareils : créer une base (Vercel Postgres, Supabase, Neon…),
ajouter des routes dans `app/api/`, puis remplacer dans `lib/store.jsx` les deux
`useEffect` qui touchent `localStorage` par des appels `fetch`. Les composants restent
inchangés.

Prévoir une authentification : sans elle, l'URL publique donnerait accès à des données
nominatives d'adhérents (souvent des mineurs).
