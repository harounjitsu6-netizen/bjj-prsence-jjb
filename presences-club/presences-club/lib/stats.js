import { moisDeIso } from "./dates";

export const ETATS = {
  present: { cle: "present", libelle: "Présent", court: "P" },
  absent: { cle: "absent", libelle: "Absent", court: "A" },
};

export const ORDRE_ETATS = ["present", "absent"];

/** Journées comportant au moins une saisie, triées, filtrées par date */
export function joursEnregistres(presences, predicat = () => true) {
  return Object.keys(presences)
    .filter((iso) => Object.keys(presences[iso] || {}).length > 0)
    .filter(predicat)
    .sort();
}

/**
 * Statistiques d'un adhérent sur les journées retenues.
 * RÈGLE : seules les journées où un statut (présent OU absent) a été validé
 * pour cet adhérent sont comptées. Une journée non cochée est totalement ignorée.
 * Taux de présence = présences ÷ journées validées.
 */
export function statsAdherent(presences, jours, adherentId) {
  let presents = 0;
  let absents = 0;

  for (const iso of jours) {
    const etat = presences[iso]?.[adherentId];
    if (etat === "present") presents++;
    else if (etat === "absent") absents++;
    // toute autre valeur (non coché) : la journée n'entre pas dans le calcul
  }

  const valides = presents + absents;
  const taux = valides === 0 ? null : (presents / valides) * 100;

  return { presents, absents, valides, taux };
}

/**
 * Classement des adhérents sur une période.
 * Trié par taux décroissant, puis moins d'absences, puis nom.
 * Les ex æquo partagent le même rang. Un adhérent sans aucune journée
 * validée est placé en fin, sans rang ni taux.
 */
export function classement(adherents, presences, predicat) {
  const jours = joursEnregistres(presences, predicat);

  const lignes = adherents
    .map((membre) => ({ membre, ...statsAdherent(presences, jours, membre.id) }))
    .sort((a, b) => {
      if (a.valides === 0 && b.valides === 0) return compareNoms(a.membre, b.membre);
      if (a.valides === 0) return 1;
      if (b.valides === 0) return -1;
      if (b.taux !== a.taux) return b.taux - a.taux;
      if (a.absents !== b.absents) return a.absents - b.absents;
      return compareNoms(a.membre, b.membre);
    });

  let rangCourant = 0;
  let precedente = null;
  lignes.forEach((ligne, index) => {
    const cle = ligne.valides === 0 ? "—" : `${ligne.taux}|${ligne.absents}`;
    if (cle !== precedente) {
      rangCourant = index + 1;
      precedente = cle;
    }
    ligne.rang = ligne.valides === 0 ? null : rangCourant;
  });

  return { jours, lignes };
}

/** Totaux du groupe sur une période, avec le même mode de calcul du taux */
export function totauxGroupe(lignes) {
  const cumul = lignes.reduce(
    (acc, l) => ({
      presents: acc.presents + l.presents,
      absents: acc.absents + l.absents,
      valides: acc.valides + l.valides,
    }),
    { presents: 0, absents: 0, valides: 0 }
  );
  cumul.taux = cumul.valides === 0 ? null : (cumul.presents / cumul.valides) * 100;
  return cumul;
}

/** Détail mois par mois pour un adhérent, sur une liste de mois "AAAA-MM" */
export function detailMensuel(presences, adherentId, mois) {
  return mois.map((am) => {
    const jours = joursEnregistres(presences, (iso) => moisDeIso(iso) === am);
    return { mois: am, ...statsAdherent(presences, jours, adherentId) };
  });
}

export function formaterTaux(taux) {
  if (taux === null || taux === undefined) return "—";
  return `${taux.toFixed(1).replace(".", ",")} %`;
}

function compareNoms(a, b) {
  return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr");
}
