import { redirect } from "next/navigation";

// Older installed manifests still open this URL. Redirect before client hydration.
export default function LaunchPage() {
  redirect("/");
}
