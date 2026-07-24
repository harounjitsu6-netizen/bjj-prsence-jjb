"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GrilleAssiduite from "@/components/GrilleAssiduite";
import TableauClassement from "@/components/TableauClassement";
import FiltreCategories from "@/components/FiltreCategories";
import { useDonnees } from "@/lib/store";
import { libelleCategorie } from "@/lib/categories";
import {
  saison,
  saisonDeIso,
  isoAujourdhui,
  libelleMois,
  moisDeIso,
} from "@/lib/dates";
import { classement, formaterTaux, totauxGroupe } from "@/lib/stats";
import { exporterClassementCSV } from "@/lib/fichiers";

export default function PageStatistiques() {
  const { pret, adherents, presences, chargerExemple } = useDonnees();
  const [portee, setPortee] = useState("mois");
  const [filtre, setFiltre] = useState("toutes");

  const datesSaisies = useMemo(() => Object.keys(presences).sort(), [presences]);

  const comptesCategorie = useMemo(() => {
    const compte = {};
    adherents.forEach((m) => {
      compte[m.categorie] = (compte[m.categorie] || 0) + 1;
    });
    return compte;
  }, [adherents]);

  const moisDisponibles = useMemo(() => {
    const set = new Set(datesSaisies.map(moisDeIso));
    set.add(moisDeIso(isoAujourdhui()));
    return [...set].sort().reverse();
  }, [datesSaisies]);

  const saisonsDisponibles = useMemo(() => {
    const set = new Set(datesSaisies.map((iso) => saisonDeIso(iso).debut));
    set.add(saisonDeIso(isoAujourdhui()).debut);
    return [...set].sort((a, b) => b - a);
  }, [datesSaisies]);

  const [mois, setMois] = useState(() => moisDeIso(isoAujourdhui()));
  const [saisonDebut, setSaisonDebut] = useState(() => saisonDeIso(isoAujourdhui()).debut);

  const saisonChoisie = saison(saisonDebut);
  const enMois = portee === "mois";

  const predicat = useMemo(
    () =>
      enMois
        ? (iso) => moisDeIso(iso) === mois
        : (iso) => iso >= saisonChoisie.du && iso <= saisonChoisie.au,
    [enMois, mois, saisonChoisie.du, saisonChoisie.au]
  );

  const adherentsFiltres = useMemo(
    () => (filtre === "toutes" ? adherents : adherents.filter((m) => m.categorie === filtre)),
    [adherents, filtre]
  );

  const { jours, lignes } = useMemo(
    () => classement(adherentsFiltres, presences, predicat),
    [adherentsFiltres, presences, predicat]
  );

  const cumul = useMemo(() => totauxGroupe(lignes), [lignes]);

  const periode = enMois ? libelleMois(mois) : `saison ${saisonChoisie.libelle}`;
  const porteeGroupe = filtre === "toutes" ? "" : ` · ${libelleCategorie(filtre)}`;

  if (!pret) return <p className="note">Ouverture du registre…</p>;

  if (adherents.length === 0) {
    return (
      <div className="carte vide">
        <span className="etiquette">Aucune donnée</span>
        <h2>Les statistiques arrivent après le premier appel</h2>
        <p>Inscrivez vos adhérents, faites l&apos;appel, et le classement se construit tout seul.</p>
        <div className="rangee" style={{ justifyContent: "center" }}>
          <Link href="/adherents" className="bouton bouton--primaire">
            Inscrire des adhérents
          </Link>
          <button type="button" className="bouton" onClick={chargerExemple}>
            Charger un club d&apos;essai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pile">
      <div className="entete-page">
        <div>
          <span className="etiquette">Assiduité</span>
          <h1>
            Classement — {periode}
            {porteeGroupe}
          </h1>
          <p className="sous-titre">
            {jours.length === 0
              ? "Aucune séance saisie sur cette période."
              : `${jours.length} séance${jours.length > 1 ? "s" : ""} prise${
                  jours.length > 1 ? "s" : ""
                } en compte. Le taux ne porte que sur les séances où un statut a été validé.`}
          </p>
        </div>

        <div className="rangee">
          <label className="champ">
            <span>Période</span>
            <select value={portee} onChange={(evenement) => setPortee(evenement.target.value)}>
              <option value="mois">Par mois</option>
              <option value="saison">Par saison</option>
            </select>
          </label>

          {enMois ? (
            <label className="champ">
              <span>Mois</span>
              <select value={mois} onChange={(evenement) => setMois(evenement.target.value)}>
                {moisDisponibles.map((valeur) => (
                  <option key={valeur} value={valeur}>
                    {libelleMois(valeur)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
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
          )}
        </div>
      </div>

      <FiltreCategories
        valeur={filtre}
        onChange={setFiltre}
        comptes={comptesCategorie}
        total={adherents.length}
      />

      <div className="compteurs">
        <div className="compteur">
          <div className="compteur-valeur">{formaterTaux(cumul.taux)}</div>
          <div className="compteur-libelle">Taux du groupe</div>
        </div>
        <div className="compteur" data-ton="present">
          <div className="compteur-valeur">{cumul.presents}</div>
          <div className="compteur-libelle">Présences</div>
        </div>
        <div className="compteur" data-ton="absent">
          <div className="compteur-valeur">{cumul.absents}</div>
          <div className="compteur-libelle">Absences</div>
        </div>
        <div className="compteur">
          <div className="compteur-valeur">{jours.length}</div>
          <div className="compteur-libelle">Séances</div>
        </div>
      </div>

      <section className="carte">
        <div className="carte-entete">
          <h2>Classement des adhérents</h2>
          <button
            type="button"
            className="bouton bouton--petit"
            disabled={jours.length === 0 || lignes.length === 0}
            onClick={() =>
              exporterClassementCSV(
                lignes,
                `classement-${filtre === "toutes" ? "tous" : filtre}-${
                  enMois ? mois : `${saisonChoisie.debut}-${saisonChoisie.fin}`
                }.csv`
              )
            }
          >
            Exporter en CSV
          </button>
        </div>

        {jours.length === 0 || lignes.length === 0 ? (
          <div className="vide">
            <p>Rien à classer : aucune séance saisie pour ce groupe sur cette période.</p>
            <Link href="/" className="bouton bouton--primaire">
              Faire l&apos;appel
            </Link>
          </div>
        ) : (
          <TableauClassement lignes={lignes} />
        )}
      </section>

      {jours.length > 0 && lignes.length > 0 && (
        <section className="carte">
          <div className="carte-entete">
            <h2>Registre — une case par séance</h2>
            <span className="note">Du plus ancien au plus récent</span>
          </div>
          <div className="carte-corps">
            <GrilleAssiduite
              membres={lignes.map((ligne) => ligne.membre)}
              presences={presences}
              jours={jours}
            />
          </div>
        </section>
      )}
    </div>
  );
}
