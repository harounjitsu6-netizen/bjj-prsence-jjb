"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import FiltreCategories from "@/components/FiltreCategories";
import { useDonnees } from "@/lib/store";
import { CATEGORIES, CATEGORIE_DEFAUT, libelleCategorie } from "@/lib/categories";
import { saison, saisonDeIso, isoAujourdhui } from "@/lib/dates";
import { classement, formaterTaux } from "@/lib/stats";
import { exporterSauvegarde, lireSauvegarde } from "@/lib/fichiers";

export default function PageAdherents() {
  const {
    pret,
    donnees,
    adherents,
    presences,
    ajouterAdherent,
    ajouterListe,
    modifierAdherent,
    supprimerAdherent,
    remplacerDonnees,
    toutEffacer,
    chargerExemple,
  } = useDonnees();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIE_DEFAUT);
  const [liste, setListe] = useState("");
  const [categorieListe, setCategorieListe] = useState(CATEGORIE_DEFAUT);
  const [collageOuvert, setCollageOuvert] = useState(false);
  const [filtre, setFiltre] = useState("toutes");
  const [enEdition, setEnEdition] = useState(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const champFichier = useRef(null);

  const saisonCourante = saisonDeIso(isoAujourdhui());

  const comptesCategorie = useMemo(() => {
    const compte = {};
    adherents.forEach((m) => {
      compte[m.categorie] = (compte[m.categorie] || 0) + 1;
    });
    return compte;
  }, [adherents]);

  const { lignes } = useMemo(
    () =>
      classement(
        adherents,
        presences,
        (iso) => iso >= saisonCourante.du && iso <= saisonCourante.au
      ),
    [adherents, presences, saisonCourante.du, saisonCourante.au]
  );

  const lignesVisibles = useMemo(
    () => (filtre === "toutes" ? lignes : lignes.filter((l) => l.membre.categorie === filtre)),
    [lignes, filtre]
  );

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (!nom.trim() && !prenom.trim()) return;
    ajouterAdherent(nom, prenom, categorie);
    setMessage(`${prenom} ${nom} inscrit·e en ${libelleCategorie(categorie)}.`);
    setNom("");
    setPrenom("");
  };

  const importerListe = () => {
    const total = ajouterListe(liste, categorieListe);
    setListe("");
    setCollageOuvert(false);
    setMessage(
      total > 0
        ? `${total} adhérent${total > 1 ? "s" : ""} inscrit·e·s en ${libelleCategorie(
            categorieListe
          )}.`
        : ""
    );
  };

  const restaurer = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;
    try {
      remplacerDonnees(await lireSauvegarde(fichier));
      setErreur("");
      setMessage("Sauvegarde restaurée.");
    } catch (souci) {
      setErreur(souci.message);
    } finally {
      evenement.target.value = "";
    }
  };

  if (!pret) return <p className="note">Ouverture du registre…</p>;

  return (
    <div className="pile">
      <div className="entete-page">
        <div>
          <span className="etiquette">Effectif du club</span>
          <h1>Adhérents</h1>
          <p className="sous-titre">
            Les taux affichés portent sur la saison {saisonCourante.libelle}, du 1<sup>er</sup>{" "}
            septembre au 31 août.
          </p>
        </div>
      </div>

      <section className="carte">
        <div className="carte-entete">
          <h2>Inscrire un adhérent</h2>
          <button
            type="button"
            className="bouton bouton--petit"
            onClick={() => setCollageOuvert((ouvert) => !ouvert)}
          >
            {collageOuvert ? "Saisie une par une" : "Coller une liste"}
          </button>
        </div>

        <div className="carte-corps">
          {collageOuvert ? (
            <div className="pile">
              <label className="champ">
                <span>Un adhérent par ligne — « Dupont Marie » ou « Dupont, Marie »</span>
                <textarea
                  value={liste}
                  onChange={(evenement) => setListe(evenement.target.value)}
                  placeholder={"Bernard Lucas\nChevalier Alice\nDiallo Moussa"}
                />
              </label>
              <div className="rangee">
                <label className="champ" style={{ maxWidth: 200 }}>
                  <span>Catégorie de la liste</span>
                  <select
                    value={categorieListe}
                    onChange={(evenement) => setCategorieListe(evenement.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.cle} value={c.cle}>
                        {c.libelle}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="bouton bouton--primaire"
                  onClick={importerListe}
                  disabled={liste.trim().length === 0}
                  style={{ alignSelf: "flex-end" }}
                >
                  Inscrire la liste
                </button>
              </div>
            </div>
          ) : (
            <form className="rangee" onSubmit={soumettre}>
              <label className="champ" style={{ flex: "1 1 170px" }}>
                <span>Nom</span>
                <input
                  type="text"
                  value={nom}
                  onChange={(evenement) => setNom(evenement.target.value)}
                  placeholder="Chevalier"
                />
              </label>
              <label className="champ" style={{ flex: "1 1 170px" }}>
                <span>Prénom</span>
                <input
                  type="text"
                  value={prenom}
                  onChange={(evenement) => setPrenom(evenement.target.value)}
                  placeholder="Alice"
                />
              </label>
              <label className="champ" style={{ flex: "0 1 160px" }}>
                <span>Catégorie</span>
                <select
                  value={categorie}
                  onChange={(evenement) => setCategorie(evenement.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.cle} value={c.cle}>
                      {c.libelle}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="bouton bouton--primaire"
                style={{ alignSelf: "flex-end" }}
              >
                Ajouter
              </button>
            </form>
          )}
          {message && (
            <p className="note" style={{ marginBottom: 0 }}>
              {message}
            </p>
          )}
        </div>
      </section>

      <section className="carte">
        <div className="carte-entete">
          <h2>
            {adherents.length} adhérent{adherents.length > 1 ? "s" : ""}
          </h2>
          {adherents.length > 0 && (
            <FiltreCategories
              valeur={filtre}
              onChange={setFiltre}
              comptes={comptesCategorie}
              total={adherents.length}
            />
          )}
        </div>

        {adherents.length === 0 ? (
          <div className="vide">
            <p>Aucun adhérent pour l&apos;instant.</p>
            <button type="button" className="bouton" onClick={chargerExemple}>
              Charger un club d&apos;essai
            </button>
          </div>
        ) : (
          <div className="tableau-cadre">
            <table>
              <thead>
                <tr>
                  <th scope="col">Adhérent</th>
                  <th scope="col">Catégorie</th>
                  <th scope="col" className="num">
                    Taux {saisonCourante.libelle}
                  </th>
                  <th scope="col" className="num masque-mobile">
                    Absences
                  </th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {lignesVisibles.map(({ membre, taux, absents }) => (
                  <tr key={membre.id}>
                    {enEdition === membre.id ? (
                      <>
                        <td>
                          <div className="rangee" style={{ flexWrap: "nowrap", gap: 6 }}>
                            <input
                              type="text"
                              value={membre.nom}
                              aria-label="Nom"
                              onChange={(evenement) =>
                                modifierAdherent(membre.id, { nom: evenement.target.value })
                              }
                            />
                            <input
                              type="text"
                              value={membre.prenom}
                              aria-label="Prénom"
                              onChange={(evenement) =>
                                modifierAdherent(membre.id, { prenom: evenement.target.value })
                              }
                            />
                          </div>
                        </td>
                        <td>
                          <select
                            value={membre.categorie}
                            aria-label="Catégorie"
                            onChange={(evenement) =>
                              modifierAdherent(membre.id, { categorie: evenement.target.value })
                            }
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.cle} value={c.cle}>
                                {c.libelle}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td colSpan={2} />
                        <td>
                          <button
                            type="button"
                            className="bouton bouton--petit bouton--primaire"
                            onClick={() => setEnEdition(null)}
                          >
                            Terminer
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <Link
                            href={`/adherents/${membre.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <strong>{membre.nom}</strong> {membre.prenom}
                          </Link>
                        </td>
                        <td>
                          <span className="categorie">{libelleCategorie(membre.categorie)}</span>
                        </td>
                        <td className="num">{formaterTaux(taux)}</td>
                        <td className="num masque-mobile">{absents || "·"}</td>
                        <td>
                          <div className="rangee" style={{ justifyContent: "flex-end", gap: 6 }}>
                            <button
                              type="button"
                              className="bouton bouton--petit"
                              onClick={() => setEnEdition(membre.id)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="bouton bouton--petit bouton--danger"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Supprimer ${membre.prenom} ${membre.nom} et tout son historique ?`
                                  )
                                )
                                  supprimerAdherent(membre.id);
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="carte">
        <div className="carte-entete">
          <h2>Sauvegarde</h2>
        </div>
        <div className="carte-corps pile">
          <p className="note" style={{ margin: 0 }}>
            Les données restent dans ce navigateur, sur cet appareil. Exportez un fichier pour les
            conserver ou les transférer ailleurs.
          </p>
          <div className="rangee">
            <button type="button" className="bouton" onClick={() => exporterSauvegarde(donnees)}>
              Exporter la sauvegarde
            </button>
            <button
              type="button"
              className="bouton"
              onClick={() => champFichier.current?.click()}
            >
              Restaurer un fichier
            </button>
            <input
              ref={champFichier}
              type="file"
              accept="application/json"
              onChange={restaurer}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="bouton bouton--danger pousser"
              onClick={() => {
                if (window.confirm("Effacer tous les adhérents et tout l'historique ?"))
                  toutEffacer();
              }}
            >
              Tout effacer
            </button>
          </div>
          {erreur && <p className="erreur">{erreur}</p>}
        </div>
      </section>
    </div>
  );
}
