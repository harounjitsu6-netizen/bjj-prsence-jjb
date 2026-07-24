"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", libelle: "Appel du jour" },
  { href: "/adherents", libelle: "Adhérents" },
  { href: "/statistiques", libelle: "Statistiques" },
];

export default function BarreNavigation() {
  const chemin = usePathname();

  const estActif = (href) =>
    href === "/" ? chemin === "/" : chemin.startsWith(href);

  return (
    <header className="barre">
      <div className="barre-contenu">
        <Link href="/" className="marque">
          <span className="marque-signe" aria-hidden="true">
            P
          </span>
          <span>Présences&nbsp;club</span>
        </Link>

        <nav className="onglets" aria-label="Navigation principale">
          {ONGLETS.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              className="onglet"
              aria-current={estActif(onglet.href) ? "page" : undefined}
            >
              {onglet.libelle}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
