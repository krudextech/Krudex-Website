import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team",
  description: "The senior engineers and designers behind Krudex Global.",
  alternates: { canonical: "/our-team" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
