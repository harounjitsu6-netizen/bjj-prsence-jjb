"use client";

import { ETATS } from "@/lib/stats";
import { libelleDate } from "@/lib/dates";

/**
 * Registre visuel : une ligne par adhérent, une case par séance saisie.
 * Lecture immédiate des séries d'absences.
 */
export default function GrilleAssiduite({ membres, presences, jours }) {
  if (jours.length === 0) return null;

  const colonnes = `max-content repeat(${jours.length}, 13px)`;

  return (
    <>
      <div className="grille-cadre">
        <div className="grille" style={{ gridTemplateColumns: colonnes }}>
          {membres.map((membre) => (
            <Ligne key={membre.id} membre={membre} presences={presences} jours={jours} />
          ))}
        </div>
      </div>

      <div className="legende">
        <span>
          <i className="case" data-etat="present" /> {ETATS.present.libelle}
        </span>
        <span>
          <i className="case" data-etat="absent" /> {ETATS.absent.libelle}
        </span>
        <span>
          <i className="case" /> Non saisi
        </span>
      </div>
    </>
  );
}

function Ligne({ membre, presences, jours }) {
  return (
    <>
      <div className="grille-nom">
        {membre.nom} {membre.prenom}
      </div>
      {jours.map((iso) => {
        const etat = presences[iso]?.[membre.id];
        const intitule = etat ? ETATS[etat].libelle : "Non saisi";
        return (
          <div
            key={iso}
            className="case"
            data-etat={etat}
            title={`${libelleDate(iso)} — ${intitule}`}
          />
        );
      })}
    </>
  );
}
