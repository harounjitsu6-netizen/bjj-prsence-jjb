import "./globals.css";
import BarreNavigation from "@/components/BarreNavigation";
import { FournisseurDonnees } from "@/lib/store";

export const metadata = {
  title: "Présences club — appel et statistiques",
  description:
    "Faire l'appel d'un club de sport en quelques secondes, puis suivre l'assiduité de chaque adhérent par catégorie, mois par mois et sur la saison.",
};

export const viewport = {
  themeColor: "#faf9f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <FournisseurDonnees>
          <BarreNavigation />
          <main className="page">{children}</main>
        </FournisseurDonnees>
      </body>
    </html>
  );
}
