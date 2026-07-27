import { ImageResponse } from "next/og";
import { getPublicTierList } from "@/lib/serverTierList";
import type { Tier, TierItem } from "@/lib/types";

export const alt = "Rankster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0c0c0f";
const PANEL = "#18181b";
const BORDER = "#27272a";
const EMBER = "#ff3450";
const FOREGROUND = "#f4f4f2";
const MUTED = "#a1a1aa";

interface OgImageProps {
  params: Promise<{ id: string }>;
}

function fallbackImage(title?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: INK,
        }}
      >
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700, color: EMBER }}>Rankster</div>
        {title && <div style={{ display: "flex", fontSize: 36, color: FOREGROUND }}>{title}</div>}
      </div>
    ),
    size,
  );
}

export default async function Image({ params }: OgImageProps) {
  const { id } = await params;
  const doc = await getPublicTierList(id);
  if (!doc) return fallbackImage();

  const itemsByTier = new Map<string, TierItem[]>();
  for (const item of doc.items) {
    if (!item.tierId) continue;
    const bucket = itemsByTier.get(item.tierId) ?? [];
    bucket.push(item);
    itemsByTier.set(item.tierId, bucket);
  }

  const filledTiers: Tier[] = [...doc.tiers]
    .sort((a, b) => a.order - b.order)
    .filter((tier) => (itemsByTier.get(tier.id)?.length ?? 0) > 0)
    .slice(0, 5);

  if (filledTiers.length === 0) return fallbackImage(doc.title);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: INK,
          padding: "40px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: FOREGROUND }}>
              {doc.title}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 6 }}>
              {doc.ownerUsername ? `par ${doc.ownerUsername} · ` : ""}
              {doc.items.length} items · {doc.tiers.length} tiers
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: EMBER }}>Rankster</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${BORDER}`,
          }}
        >
          {filledTiers.map((tier) => (
            <div key={tier.id} style={{ display: "flex", flex: 1, borderBottom: `1px solid ${BORDER}` }}>
              <div
                style={{
                  width: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: tier.color,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {tier.label}
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                  background: PANEL,
                }}
              >
                {(itemsByTier.get(tier.id) ?? []).slice(0, 6).map((item) => (
                  // eslint-disable-next-line @next/next/no-img-element -- next/og requires plain <img>, not next/image
                  <img
                    key={item.id}
                    src={item.thumbnailUrl}
                    alt=""
                    width={72}
                    height={72}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
