"use client";

import Link from "next/link";
import { libelleCategorie } from "@/lib/categories";
import { formaterTaux } from "@/lib/stats";

export default function TableauClassement({ lignes }) {
  return (
    <div className="tableau-cadre">
      <table>
        <thead>
          <tr>
            <th scope="col">Rang</th>
            <th scope="col">Adhérent</th>
            <th scope="col" className="masque-mobile">
              Catégorie
            </th>
            <th scope="col">Taux de présence</th>
            <th scope="col" className="num">
              Présences
            </th>
            <th scope="col" className="num">
              Absences
            </th>
            <th scope="col" className="num masque-mobile">
              Séances
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.membre.id} data-podium={ligne.rang <= 3 ? ligne.rang : undefined}>
              <td className="col-rang">{ligne.rang ?? "—"}</td>
              <td>
                <Link href={`/adherents/${ligne.membre.id}`} style={{ textDecoration: "none" }}>
                  <strong>{ligne.membre.nom}</strong> {ligne.membre.prenom}
                </Link>
              </td>
              <td className="masque-mobile">
                <span className="categorie">{libelleCategorie(ligne.membre.categorie)}</span>
              </td>
              <td className="jauge">
                <span className="jauge-fond" aria-hidden="true" />
                {ligne.taux !== null && (
                  <span
                    className="jauge-valeur"
                    style={{ width: `calc((100% - 24px) * ${ligne.taux / 100})` }}
                    aria-hidden="true"
                  />
                )}
                <span className="jauge-texte">{formaterTaux(ligne.taux)}</span>
              </td>
              <td className="num">{ligne.presents}</td>
              <td className="num">{ligne.absents || "·"}</td>
              <td className="num masque-mobile">{ligne.valides}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
