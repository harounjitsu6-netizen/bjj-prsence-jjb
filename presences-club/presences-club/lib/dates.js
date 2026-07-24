export const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const deuxChiffres = (n) => String(n).padStart(2, "0");

/** Date -> "AAAA-MM-JJ" (heure locale, jamais UTC) */
export function isoDe(date) {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(
    date.getDate()
  )}`;
}

export function isoAujourdhui() {
  return isoDe(new Date());
}

/** "AAAA-MM-JJ" -> Date locale */
export function dateDeIso(iso) {
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(a, m - 1, j);
}

/** "2026-07-24" -> "vendredi 24 juillet 2026" */
export function libelleDate(iso) {
  const d = dateDeIso(iso);
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-07-24" -> "24/07" */
export function libelleDateCourt(iso) {
  const [, m, j] = iso.split("-");
  return `${j}/${m}`;
}

export function estWeekend(iso) {
  const jour = dateDeIso(iso).getDay();
  return jour === 0 || jour === 6;
}

/** "2026-07-24" -> "2026-07" */
export function moisDeIso(iso) {
  return iso.slice(0, 7);
}

/** "2026-07" -> "juillet 2026" */
export function libelleMois(am) {
  const [a, m] = am.split("-").map(Number);
  return `${MOIS[m - 1]} ${a}`;
}

/** "2026-07" -> "juil." */
export function libelleMoisCourt(am) {
  const m = Number(am.split("-")[1]);
  const nom = MOIS[m - 1];
  return nom.length > 5 ? `${nom.slice(0, 4)}.` : nom;
}

/**
 * Saison sportive d'une date : du 1er septembre au 31 août.
 * "2026-07-24" -> { debut: 2025, fin: 2026, libelle: "2025 – 2026", du, au }
 */
export function saisonDeIso(iso) {
  const [a, m] = iso.split("-").map(Number);
  const debut = m >= 9 ? a : a - 1;
  return saison(debut);
}

export function saison(debut) {
  return {
    debut,
    fin: debut + 1,
    libelle: `${debut} – ${debut + 1}`,
    du: `${debut}-09-01`,
    au: `${debut + 1}-08-31`,
  };
}

/** Les 12 mois d'une saison, de septembre à août */
export function moisDeSaison(debut) {
  const liste = [];
  for (let m = 9; m <= 12; m++) liste.push(`${debut}-${deuxChiffres(m)}`);
  for (let m = 1; m <= 8; m++) liste.push(`${debut + 1}-${deuxChiffres(m)}`);
  return liste;
}

export function dansSaison(iso, debut) {
  const s = saison(debut);
  return iso >= s.du && iso <= s.au;
}
