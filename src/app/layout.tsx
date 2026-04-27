import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

import { getBrandName } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
    title: `${brandName} | Professional Training Courses`,
    description: `Official portal for ${brandName}, providing modern computer education and professional training.`,
  };
}

import { BrandProvider } from "@/context/BrandContext";
import { AuthProvider } from "@/context/AuthContext";
import { getFullBrandData } from "@/lib/settings";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandData = await getFullBrandData();

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <BrandProvider initialData={brandData}>
            {children}
          </BrandProvider>
        </AuthProvider>
        <ScrollToTopButton />
      </body>
    </html>
  );
}
