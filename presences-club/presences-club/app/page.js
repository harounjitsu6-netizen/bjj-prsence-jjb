"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SelecteurEtat from "@/components/SelecteurEtat";
import FiltreCategories from "@/components/FiltreCategories";
import { useDonnees } from "@/lib/store";
import { libelleCategorie } from "@/lib/categories";
import { estWeekend, isoAujourdhui, libelleDate } from "@/lib/dates";

export default function PageAppel() {
  const { pret, adherents, presences, definirEtat, definirEtatGroupe, chargerExemple } =
    useDonnees();
  const [jour, setJour] = useState(isoAujourdhui);
  const [filtre, setFiltre] = useState("toutes");

  const saisie = presences[jour] || {};

  const comptesCategorie = useMemo(() => {
    const compte = {};
    adherents.forEach((m) => {
      compte[m.categorie] = (compte[m.categorie] || 0) + 1;
    });
    return compte;
  }, [adherents]);

  const tries = useMemo(
    () =>
      [...adherents].sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr")
      ),
    [adherents]
  );

  const visibles = useMemo(
    () => (filtre === "toutes" ? tries : tries.filter((m) => m.categorie === filtre)),
    [tries, filtre]
  );

  const visiblesIds = useMemo(() => visibles.map((m) => m.id), [visibles]);
  const auMoinsUnMarque = visiblesIds.some((id) => saisie[id]);

  const totaux = useMemo(() => {
    const compte = { present: 0, absent: 0 };
    visibles.forEach((m) => {
      const etat = saisie[m.id];
      if (etat) compte[etat] += 1;
    });
    return { ...compte, restants: visibles.length - (compte.present + compte.absent) };
  }, [visibles, saisie]);

  if (!pret) return <p className="note">Ouverture du registre…</p>;

  if (adherents.length === 0) {
    return (
      <div className="carte vide">
        <span className="etiquette">Registre vide</span>
        <h2>Commencez par inscrire vos adhérents</h2>
        <p>
          Ajoutez-les un par un ou collez votre liste d&apos;un seul coup, en choisissant leur
          catégorie. L&apos;appel et les statistiques suivront.
        </p>
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

  const etiquetteGroupe = filtre === "toutes" ? "Tout le club" : libelleCategorie(filtre);

  return (
    <div className="pile">
      <div className="entete-page">
        <div>
          <span className="etiquette">Appel du jour</span>
          <h1>{libelleDate(jour)}</h1>
          {estWeekend(jour) && <p className="sous-titre">Cette date tombe un week-end.</p>}
        </div>

        <div className="rangee">
          <label className="champ">
            <span>Date de la séance</span>
            <input
              type="date"
              value={jour}
              onChange={(evenement) => setJour(evenement.target.value)}
            />
          </label>
          <button
            type="button"
            className="bouton"
            onClick={() => setJour(isoAujourdhui())}
            disabled={jour === isoAujourdhui()}
            style={{ alignSelf: "flex-end" }}
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <FiltreCategories
        valeur={filtre}
        onChange={setFiltre}
        comptes={comptesCategorie}
        total={adherents.length}
      />

      <div className="compteurs">
        <div className="compteur" data-ton="present">
          <div className="compteur-valeur">{totaux.present}</div>
          <div className="compteur-libelle">Présents</div>
        </div>
        <div className="compteur" data-ton="absent">
          <div className="compteur-valeur">{totaux.absent}</div>
          <div className="compteur-libelle">Absents</div>
        </div>
        <div className="compteur">
          <div className="compteur-valeur">{totaux.restants}</div>
          <div className="compteur-libelle">Non saisis</div>
        </div>
      </div>

      <section className="carte">
        <div className="carte-entete">
          <h2>
            {etiquetteGroupe} · {visibles.length} adhérent{visibles.length > 1 ? "s" : ""}
          </h2>
          <div className="rangee">
            <button
              type="button"
              className="bouton bouton--petit bouton--primaire"
              onClick={() => definirEtatGroupe(jour, visiblesIds, "present")}
              disabled={visibles.length === 0}
            >
              Tout présent
            </button>
            <button
              type="button"
              className="bouton bouton--petit bouton--danger"
              onClick={() => definirEtatGroupe(jour, visiblesIds, null)}
              disabled={!auMoinsUnMarque}
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="cahier">
          {visibles.map((membre, index) => (
            <div key={membre.id} className="ligne" data-etat={saisie[membre.id]}>
              <div className="ligne-numero">{index + 1}</div>
              <div className="ligne-nom">
                <Link href={`/adherents/${membre.id}`}>
                  <strong>{membre.nom}</strong> {membre.prenom}
                </Link>
                <span className="ligne-detail">{libelleCategorie(membre.categorie)}</span>
              </div>
              <SelecteurEtat
                valeur={saisie[membre.id]}
                nomMembre={`${membre.prenom} ${membre.nom}`}
                onChange={(etat) => definirEtat(jour, membre.id, etat)}
              />
            </div>
          ))}
        </div>
      </section>

      <p className="note">
        Astuce : « Tout présent » coche tout le groupe affiché d&apos;un coup, puis vous corrigez
        les absents. Avec un filtre actif, les boutons n&apos;agissent que sur la catégorie
        visible. Un second clic sur un statut l&apos;efface.
      </p>
    </div>
  );
}
