"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import GrilleAssiduite from "@/components/GrilleAssiduite";
import { useDonnees } from "@/lib/store";
import { libelleCategorie } from "@/lib/categories";
import {
  saison,
  saisonDeIso,
  isoAujourdhui,
  libelleMois,
  moisDeSaison,
} from "@/lib/dates";
import { detailMensuel, formaterTaux, joursEnregistres, statsAdherent } from "@/lib/stats";

export default function PageFicheAdherent() {
  const parametres = useParams();
  const id = String(parametres?.id || "");
  const { pret, adherents, presences } = useDonnees();
  const [saisonDebut, setSaisonDebut] = useState(() => saisonDeIso(isoAujourdhui()).debut);

  const membre = adherents.find((candidat) => candidat.id === id);
  const saisonChoisie = saison(saisonDebut);

  const saisonsDisponibles = useMemo(() => {
    const set = new Set(Object.keys(presences).map((iso) => saisonDeIso(iso).debut));
    set.add(saisonDeIso(isoAujourdhui()).debut);
    return [...set].sort((a, b) => b - a);
  }, [presences]);

  const jours = useMemo(
    () =>
      joursEnregistres(presences, (iso) => iso >= saisonChoisie.du && iso <= saisonChoisie.au),
    [presences, saisonChoisie.du, saisonChoisie.au]
  );

  const bilan = useMemo(
    () => (membre ? statsAdherent(presences, jours, membre.id) : null),
    [presences, jours, membre]
  );

  const parMois = useMemo(
    () => (membre ? detailMensuel(presences, membre.id, moisDeSaison(saisonDebut)) : []),
    [presences, membre, saisonDebut]
  );

  if (!pret) return <p className="note">Ouverture du registre…</p>;

  if (!membre) {
    return (
      <div className="carte vide">
        <h2>Cet adhérent n&apos;est plus dans l&apos;effectif</h2>
        <p>Il a peut-être été supprimé, ou le lien provient d&apos;un autre appareil.</p>
        <Link href="/adherents" className="bouton bouton--primaire">
          Retour à l&apos;effectif
        </Link>
      </div>
    );
  }

  const moisRenseignes = parMois.filter((ligne) => ligne.valides > 0);

  return (
    <div className="pile">
      <div className="entete-page">
        <div>
          <span className="etiquette">Fiche adhérent</span>
          <h1>
            {membre.prenom} {membre.nom}
          </h1>
          <p className="sous-titre">
            Catégorie {libelleCategorie(membre.categorie)} · Saison {saisonChoisie.libelle}
          </p>
        </div>

        <div className="rangee">
          <label className="champ">
            <span>Saison</span>
            <select
              value={saisonDebut}
              onChange={(evenement) => setSaisonDebut(Number(evenement.target.value))}
            >
              {saisonsDisponibles.map((debut) => (
                <option key={debut} value={debut}>
                  {saison(debut).libelle}
                </option>
              ))}
            </select>
          </label>
          <Link href="/adherents" className="bouton" style={{ alignSelf: "flex-end" }}>
            Retour à l&apos;effectif
          </Link>
        </div>
      </div>

      <div className="compteurs">
        <div className="compteur">
          <div className="compteur-valeur">{formaterTaux(bilan.taux)}</div>
          <div className="compteur-libelle">Taux de la saison</div>
        </div>
        <div className="compteur" data-ton="present">
          <div className="compteur-valeur">{bilan.presents}</div>
          <div className="compteur-libelle">Présences</div>
        </div>
        <div className="compteur" data-ton="absent">
          <div className="compteur-valeur">{bilan.absents}</div>
          <div className="compteur-libelle">Absences</div>
        </div>
        <div className="compteur">
          <div className="compteur-valeur">{bilan.valides}</div>
          <div className="compteur-libelle">Séances validées</div>
        </div>
      </div>

      <section className="carte">
        <div className="carte-entete">
          <h2>Mois par mois</h2>
          <span className="note">De septembre à août</span>
        </div>

        {moisRenseignes.length === 0 ? (
          <div className="vide">
            <p>Aucune séance enregistrée pour cet adhérent sur la saison {saisonChoisie.libelle}.</p>
            <Link href="/" className="bouton bouton--primaire">
              Faire l&apos;appel
            </Link>
          </div>
        ) : (
          <div className="tableau-cadre">
            <table>
              <thead>
                <tr>
                  <th scope="col">Mois</th>
                  <th scope="col" className="num">
                    Présences
                  </th>
                  <th scope="col" className="num">
                    Absences
                  </th>
                  <th scope="col" className="num">
                    Séances
                  </th>
                  <th scope="col" className="num">
                    Taux
                  </th>
                </tr>
              </thead>
              <tbody>
                {moisRenseignes.map((ligne) => (
                  <tr key={ligne.mois}>
                    <td>{libelleMois(ligne.mois)}</td>
                    <td className="num">{ligne.presents}</td>
                    <td className="num">{ligne.absents || "·"}</td>
                    <td className="num">{ligne.valides}</td>
                    <td className="num">
                      <strong>{formaterTaux(ligne.taux)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {jours.length > 0 && (
        <section className="carte">
          <div className="carte-entete">
            <h2>Séance par séance</h2>
            <span className="note">Survolez une case pour voir la date</span>
          </div>
          <div className="carte-corps">
            <GrilleAssiduite membres={[membre]} presences={presences} jours={jours} />
          </div>
        </section>
      )}
    </div>
  );
}
