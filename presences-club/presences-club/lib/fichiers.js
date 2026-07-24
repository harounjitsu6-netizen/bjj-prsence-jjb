import { formaterTaux } from "./stats";
import { libelleCategorie } from "./categories";

function telecharger(nomFichier, contenu, type) {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

const echapper = (valeur) => {
  const texte = String(valeur ?? "");
  return /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
};

/** CSV séparé par des points-virgules, avec BOM : s'ouvre directement dans Excel en français */
export function exporterClassementCSV(lignes, nomFichier) {
  const entetes = [
    "Rang",
    "Nom",
    "Prénom",
    "Catégorie",
    "Jours validés",
    "Présences",
    "Absences",
    "Taux de présence",
  ];

  const corps = lignes.map((l) =>
    [
      l.rang ?? "",
      l.membre.nom,
      l.membre.prenom,
      libelleCategorie(l.membre.categorie),
      l.valides,
      l.presents,
      l.absents,
      formaterTaux(l.taux),
    ]
      .map(echapper)
      .join(";")
  );

  const csv = "\uFEFF" + [entetes.join(";"), ...corps].join("\r\n");
  telecharger(nomFichier, csv, "text/csv;charset=utf-8");
}

export function exporterSauvegarde(donnees) {
  const date = new Date().toISOString().slice(0, 10);
  telecharger(
    `presences-club-${date}.json`,
    JSON.stringify(donnees, null, 2),
    "application/json"
  );
}

export function lireSauvegarde(fichier) {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      try {
        resoudre(JSON.parse(String(lecteur.result)));
      } catch (erreur) {
        rejeter(new Error("Ce fichier n'est pas une sauvegarde valide."));
      }
    };
    lecteur.onerror = () => rejeter(new Error("Lecture du fichier impossible."));
    lecteur.readAsText(fichier);
  });
}
