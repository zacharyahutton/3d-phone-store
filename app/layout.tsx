import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Titan 3D Store",
  description: "Premium 3D Customizer Experience",
  metadataBase: new URL("https://titan.zacharyhutton.online"),
  openGraph: {
    title: "Titan 3D Store",
    url: "https://titan.zacharyhutton.online/",
    images: [
      {
        url: "/og.jpg?v=2026-10-13",
        width: 1200,
        height: 630,
        alt: "Titan homepage, website by Zachary Hutton",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg?v=2026-10-13"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
