import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const BUCKET = "tier-list-images";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const jwt = authHeader?.replace("Bearer ", "");
  if (!jwt) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(jwt);
  if (userError || !user) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: files } = await adminClient.storage.from(BUCKET).list(user.id);
  if (files && files.length > 0) {
    await adminClient.storage.from(BUCKET).remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // Cascades to tier_lists (and from there to comparison_snapshots).
  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", user.id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
