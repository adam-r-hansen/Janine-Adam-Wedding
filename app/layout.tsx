import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import Background from "@/components/Background";
import NavBar from "@/components/NavBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import DrawerShell from "@/components/DrawerShell";
import { supabase } from "@/lib/supabase";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Build every page fresh on each visit, so the nav always reflects the
  // current "Publish seating chart" switch — otherwise pages Next.js
  // pre-builds ahead of time (like /rsvp) would freeze whatever the
  // setting was at deploy time.
  await connection();

  // Same rule as the /seating page itself: only the exact value "true"
  // shows the link; a missing row or a failed lookup keeps it hidden.
  const { data: seatingSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "seating_published")
    .maybeSingle();
  const showSeating = seatingSetting?.value === "true";

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${pinyon.variable} antialiased`}
    >
      <body className="flex flex-col font-sans">
        <DrawerShell showSeating={showSeating}>
          <Background />
          <NavBar showSeating={showSeating} />
          <main className="flex flex-1 flex-col">{children}</main>
          <ConditionalFooter />
        </DrawerShell>
      </body>
    </html>
  );
}
