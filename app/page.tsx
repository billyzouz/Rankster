import { HomeClient } from "@/components/HomeClient";
import { listPublicTierListsForHome } from "@/lib/serverTierList";

export default async function Home() {
  const initialLists = await listPublicTierListsForHome();
  return <HomeClient initialLists={initialLists} />;
}
