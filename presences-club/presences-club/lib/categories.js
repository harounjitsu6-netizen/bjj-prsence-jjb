export const CATEGORIES = [
  { cle: "enfant", libelle: "Enfant" },
  { cle: "ado", libelle: "Adolescent" },
  { cle: "adulte", libelle: "Adulte" },
];

export const CATEGORIE_DEFAUT = "adulte";

const CLES = new Set(CATEGORIES.map((c) => c.cle));

export function estCategorie(cle) {
  return CLES.has(cle);
}

/** Ramène n'importe quelle valeur douteuse vers une catégorie connue */
export function normaliserCategorie(cle) {
  return CLES.has(cle) ? cle : CATEGORIE_DEFAUT;
}

export function libelleCategorie(cle) {
  return CATEGORIES.find((c) => c.cle === cle)?.libelle || "—";
}
