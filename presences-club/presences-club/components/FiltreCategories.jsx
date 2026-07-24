"use client";

import { CATEGORIES } from "@/lib/categories";

/**
 * Barre de filtres : « Toutes » puis une pastille par catégorie, avec effectif.
 * valeur = "toutes" | "enfant" | "ado" | "adulte"
 */
export default function FiltreCategories({ valeur, onChange, comptes, total }) {
  const pastilles = [
    { cle: "toutes", libelle: "Toutes", compte: total },
    ...CATEGORIES.map((c) => ({ cle: c.cle, libelle: c.libelle, compte: comptes[c.cle] || 0 })),
  ];

  return (
    <div className="filtres" role="group" aria-label="Filtrer par catégorie">
      {pastilles.map((p) => (
        <button
          key={p.cle}
          type="button"
          className="filtre"
          aria-pressed={valeur === p.cle}
          onClick={() => onChange(p.cle)}
        >
          {p.libelle}
          <span className="filtre-compte">{p.compte}</span>
        </button>
      ))}
    </div>
  );
}
