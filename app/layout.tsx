import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statistical Trend Forecast Pro — Crypto Demo",
  description: "Demo statistical forecast for crypto futures scalping visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
