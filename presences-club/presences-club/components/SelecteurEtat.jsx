"use client";

import { ETATS, ORDRE_ETATS } from "@/lib/stats";

/**
 * Sélecteur présent / absent. Cliquer sur l'état déjà retenu efface la saisie.
 */
export default function SelecteurEtat({ valeur, onChange, nomMembre }) {
  return (
    <div className="segment" role="group" aria-label={`Statut de ${nomMembre}`}>
      {ORDRE_ETATS.map((cle) => {
        const etat = ETATS[cle];
        const choisi = valeur === cle;
        return (
          <button
            key={cle}
            type="button"
            data-etat={cle}
            aria-pressed={choisi}
            title={choisi ? "Cliquer à nouveau pour effacer" : etat.libelle}
            onClick={() => onChange(choisi ? null : cle)}
          >
            <span className="segment-long">{etat.libelle}</span>
            <span className="segment-court">{etat.court}</span>
          </button>
        );
      })}
    </div>
  );
}
