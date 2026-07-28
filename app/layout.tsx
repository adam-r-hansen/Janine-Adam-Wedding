import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";
import NavBar from "@/components/NavBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import DrawerShell from "@/components/DrawerShell";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: "variable",
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Janine & Adam — October 17, 2026",
  description:
    "Join us as we celebrate our wedding in University Place, Washington.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${pinyon.variable} antialiased`}
    >
      <body className="flex flex-col font-sans">
        <DrawerShell>
          <Background />
          <NavBar />
          <main className="flex flex-1 flex-col">{children}</main>
          <ConditionalFooter />
        </DrawerShell>
      </body>
    </html>
  );
}
