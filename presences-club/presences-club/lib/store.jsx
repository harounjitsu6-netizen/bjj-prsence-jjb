"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isoDe } from "./dates";
import { CATEGORIE_DEFAUT, normaliserCategorie } from "./categories";

const CLE = "presences-club:v2";
const VIDE = { version: 2, adherents: [], presences: {} };

const Contexte = createContext(null);

function identifiant() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Remet en forme des données lues ou importées.
 * - accepte l'ancienne clé "eleves" et l'ancien champ "classe" (ignoré)
 * - garantit une catégorie connue pour chaque adhérent
 * - migre les anciens statuts "retard" en "present"
 */
function nettoyer(brut) {
  if (!brut || typeof brut !== "object") return { version: 2, adherents: [], presences: {} };

  const source = Array.isArray(brut.adherents)
    ? brut.adherents
    : Array.isArray(brut.eleves)
      ? brut.eleves
      : [];

  const adherents = source.map((m) => ({
    id: m.id || identifiant(),
    nom: String(m.nom || "").trim(),
    prenom: String(m.prenom || "").trim(),
    categorie: normaliserCategorie(m.categorie),
  }));

  const presencesBrutes =
    brut.presences && typeof brut.presences === "object" ? brut.presences : {};
  const presences = {};
  for (const [iso, jour] of Object.entries(presencesBrutes)) {
    if (!jour || typeof jour !== "object") continue;
    const nettoye = {};
    for (const [id, etat] of Object.entries(jour)) {
      const e = etat === "retard" ? "present" : etat;
      if (e === "present" || e === "absent") nettoye[id] = e;
    }
    if (Object.keys(nettoye).length > 0) presences[iso] = nettoye;
  }

  return { version: 2, adherents, presences };
}

export function FournisseurDonnees({ children }) {
  const [donnees, setDonnees] = useState(VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE) || window.localStorage.getItem("cahier-appel:v1");
      if (brut) setDonnees(nettoyer(JSON.parse(brut)));
    } catch (erreur) {
      console.warn("Sauvegarde illisible, on repart d'un registre vide.", erreur);
    }
    setPret(true);
  }, []);

  useEffect(() => {
    if (!pret) return;
    try {
      window.localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch (erreur) {
      console.warn("Enregistrement impossible.", erreur);
    }
  }, [donnees, pret]);

  const ajouterAdherent = useCallback((nom, prenom, categorie = CATEGORIE_DEFAUT) => {
    const membre = {
      id: identifiant(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      categorie: normaliserCategorie(categorie),
    };
    if (!membre.nom && !membre.prenom) return null;
    setDonnees((d) => ({ ...d, adherents: [...d.adherents, membre] }));
    return membre;
  }, []);

  /** Une ligne = un adhérent. Formats : "Dupont Marie", "Dupont, Marie", "Marie Dupont" */
  const ajouterListe = useCallback((texte, categorie = CATEGORIE_DEFAUT) => {
    const cat = normaliserCategorie(categorie);
    const nouveaux = texte
      .split("\n")
      .map((ligne) => ligne.trim())
      .filter(Boolean)
      .map((ligne) => {
        let nom = ligne;
        let prenom = "";
        if (ligne.includes(",")) {
          const [a, b = ""] = ligne.split(",");
          nom = a.trim();
          prenom = b.trim();
        } else {
          const mots = ligne.split(/\s+/);
          if (mots.length > 1) {
            nom = mots[0];
            prenom = mots.slice(1).join(" ");
          }
        }
        return { id: identifiant(), nom, prenom, categorie: cat };
      });
    if (nouveaux.length === 0) return 0;
    setDonnees((d) => ({ ...d, adherents: [...d.adherents, ...nouveaux] }));
    return nouveaux.length;
  }, []);

  const modifierAdherent = useCallback((id, champs) => {
    setDonnees((d) => ({
      ...d,
      adherents: d.adherents.map((m) =>
        m.id === id
          ? { ...m, ...champs, categorie: normaliserCategorie(champs.categorie ?? m.categorie) }
          : m
      ),
    }));
  }, []);

  const supprimerAdherent = useCallback((id) => {
    setDonnees((d) => {
      const presences = {};
      for (const [iso, jour] of Object.entries(d.presences)) {
        const copie = { ...jour };
        delete copie[id];
        if (Object.keys(copie).length > 0) presences[iso] = copie;
      }
      return { ...d, adherents: d.adherents.filter((m) => m.id !== id), presences };
    });
  }, []);

  /** Statut d'un seul adhérent. etat = "present" | "absent" | null (efface) */
  const definirEtat = useCallback((iso, adherentId, etat) => {
    setDonnees((d) => {
      const jour = { ...(d.presences[iso] || {}) };
      if (etat === null) delete jour[adherentId];
      else jour[adherentId] = etat;
      const presences = { ...d.presences };
      if (Object.keys(jour).length === 0) delete presences[iso];
      else presences[iso] = jour;
      return { ...d, presences };
    });
  }, []);

  /**
   * Applique un statut à une liste d'adhérents pour une journée, sans toucher
   * aux autres. Sert aux boutons « tout présent » / « effacer » avec un filtre
   * de catégorie actif. etat = null pour effacer.
   */
  const definirEtatGroupe = useCallback((iso, adherentIds, etat) => {
    setDonnees((d) => {
      const jour = { ...(d.presences[iso] || {}) };
      adherentIds.forEach((id) => {
        if (etat === null) delete jour[id];
        else jour[id] = etat;
      });
      const presences = { ...d.presences };
      if (Object.keys(jour).length === 0) delete presences[iso];
      else presences[iso] = jour;
      return { ...d, presences };
    });
  }, []);

  const remplacerDonnees = useCallback((brut) => setDonnees(nettoyer(brut)), []);
  const toutEffacer = useCallback(() => setDonnees({ version: 2, adherents: [], presences: {} }), []);
  const chargerExemple = useCallback(() => setDonnees(exemple()), []);

  const valeur = useMemo(
    () => ({
      donnees,
      pret,
      adherents: donnees.adherents,
      presences: donnees.presences,
      ajouterAdherent,
      ajouterListe,
      modifierAdherent,
      supprimerAdherent,
      definirEtat,
      definirEtatGroupe,
      remplacerDonnees,
      toutEffacer,
      chargerExemple,
    }),
    [
      donnees,
      pret,
      ajouterAdherent,
      ajouterListe,
      modifierAdherent,
      supprimerAdherent,
      definirEtat,
      definirEtatGroupe,
      remplacerDonnees,
      toutEffacer,
      chargerExemple,
    ]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees() {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useDonnees doit être utilisé dans <FournisseurDonnees>");
  return contexte;
}

/** Jeu d'essai : 12 adhérents répartis en catégories, 40 séances tirées au sort */
function exemple() {
  const base = [
    ["Bahri", "Yasmine", "enfant"],
    ["Bernard", "Lucas", "enfant"],
    ["Chevalier", "Alice", "enfant"],
    ["Diallo", "Moussa", "enfant"],
    ["Faure", "Camille", "ado"],
    ["Gomes", "Tiago", "ado"],
    ["Kaczmarek", "Éva", "ado"],
    ["Lambert", "Noah", "ado"],
    ["Mercier", "Jade", "adulte"],
    ["Nguyen", "Linh", "adulte"],
    ["Roussel", "Adam", "adulte"],
    ["Traoré", "Aya", "adulte"],
  ];

  const adherents = base.map(([nom, prenom, categorie]) => ({
    id: identifiant(),
    nom,
    prenom,
    categorie,
  }));

  const fiabilite = adherents.map((_, i) => 0.97 - i * 0.03);

  const presences = {};
  const curseur = new Date();
  let restants = 40;
  while (restants > 0) {
    const jour = curseur.getDay();
    // Séances les lundis, mardis, jeudis, vendredis
    if (jour !== 0 && jour !== 3 && jour !== 6) {
      const iso = isoDe(curseur);
      const saisie = {};
      adherents.forEach((membre, i) => {
        saisie[membre.id] = Math.random() > fiabilite[i] ? "absent" : "present";
      });
      presences[iso] = saisie;
      restants--;
    }
    curseur.setDate(curseur.getDate() - 1);
  }

  return { version: 2, adherents, presences };
}
