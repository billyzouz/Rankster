import { NextResponse } from "next/server";

const ITUNES_BASE = "https://itunes.apple.com";

/**
 * iTunes Search API doesn't send CORS headers, so it can't be called directly
 * from the browser — this proxies a fixed set of known-safe lookups through
 * our own server instead of accepting an arbitrary upstream URL from the client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  let upstreamUrl: string;
  switch (action) {
    case "search-artist": {
      const term = searchParams.get("term");
      if (!term) return NextResponse.json({ error: "Paramètre 'term' manquant." }, { status: 400 });
      upstreamUrl = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&entity=musicArtist&limit=10`;
      break;
    }
    case "artist-albums": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
      upstreamUrl = `${ITUNES_BASE}/lookup?id=${encodeURIComponent(id)}&entity=album&limit=200`;
      break;
    }
    case "album-tracks": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
      upstreamUrl = `${ITUNES_BASE}/lookup?id=${encodeURIComponent(id)}&entity=song`;
      break;
    }
    case "artist-tracks": {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
      upstreamUrl = `${ITUNES_BASE}/lookup?id=${encodeURIComponent(id)}&entity=song&limit=200`;
      break;
    }
    default:
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  }

  const res = await fetch(upstreamUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Impossible de contacter iTunes." }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
