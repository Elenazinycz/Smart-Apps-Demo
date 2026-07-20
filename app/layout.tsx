import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Praxis Demir & Kollegen",
  description: "Praxis-Terminsoftware für Demir & Kollegen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
