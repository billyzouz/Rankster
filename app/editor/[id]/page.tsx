import type { Metadata } from "next";
import { getPublicTierList } from "@/lib/serverTierList";
import { EditorClient } from "./EditorClient";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const doc = await getPublicTierList(id);
  if (!doc) return {};

  const title = `${doc.title} — Rankster`;
  const description = `${doc.ownerUsername ? `Tier list par ${doc.ownerUsername} · ` : ""}${doc.items.length} items · ${doc.tiers.length} tiers`;

  return {
    title,
    description,
    openGraph: { title, description, siteName: "Rankster", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  return <EditorClient id={id} />;
}
