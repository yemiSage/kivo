import { notFound } from "next/navigation";
import { VaultInviteAccept } from "@/components/VaultInviteAccept";

export default async function VaultInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  return <VaultInviteAccept token={token} />;
}
