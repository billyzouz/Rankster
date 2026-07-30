import { NextResponse } from "next/server";

const DEEZER_BASE = "https://api.deezer.com";
// Cap how many releases/tracks we fan out to, so a very prolific artist
// can't blow past the function's time limit.
const MAX_ALBUMS_FOR_ALL_TRACKS = 60;

type DeezerItem = Record<string, unknown>;

async function paginate(url: string, cap: number): Promise<DeezerItem[]> {
  const items: DeezerItem[] = [];
  let next: string | null = url;
  while (next && items.length < cap) {
    const res: Response = await fetch(next);
    if (!res.ok) throw new Error("Impossible de contacter Deezer.");
    const page: { data?: DeezerItem[]; next?: string } = await res.json();
    items.push(...(page.data ?? []));
    next = typeof page.next === "string" ? page.next : null;
  }
  return items.slice(0, cap);
}

/**
 * Deezer's public API doesn't send Access-Control-Allow-Origin, so it can't be
 * called directly from the browser — this proxies a fixed set of known-safe
 * lookups through our own server. No auth needed: Deezer's catalog endpoints
 * are fully public.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "search-artist": {
        const q = searchParams.get("q");
        if (!q) return NextResponse.json({ error: "Paramètre 'q' manquant." }, { status: 400 });
        const res = await fetch(`${DEEZER_BASE}/search/artist?q=${encodeURIComponent(q)}&limit=25`);
        if (!res.ok) return NextResponse.json({ error: "Impossible de contacter Deezer." }, { status: 502 });
        return NextResponse.json(await res.json());
      }
      case "artist-albums": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
        const data = await paginate(`${DEEZER_BASE}/artist/${encodeURIComponent(id)}/albums?limit=100`, 200);
        return NextResponse.json({ data });
      }
      case "album-tracks": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
        const data = await paginate(`${DEEZER_BASE}/album/${encodeURIComponent(id)}/tracks?limit=100`, 200);
        return NextResponse.json({ data });
      }
      case "artist-tracks": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });

        const albums = await paginate(
          `${DEEZER_BASE}/artist/${encodeURIComponent(id)}/albums?limit=100`,
          MAX_ALBUMS_FOR_ALL_TRACKS,
        );
        const trackLists = await Promise.all(
          albums.map(async (album) => {
            try {
              return await paginate(`${DEEZER_BASE}/album/${album.id}/tracks?limit=100`, 100);
            } catch {
              return [];
            }
          }),
        );
        return NextResponse.json({ data: trackLists.flat() });
      }
      default:
        return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Deezer." },
      { status: 502 },
    );
  }
}
