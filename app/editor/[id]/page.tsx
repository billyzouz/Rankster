import { EditorClient } from "./EditorClient";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  return <EditorClient id={id} />;
}
