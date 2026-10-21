import { AppDownloads } from "@/components/AppDownloads";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function DownloadCheck() {
  return <main className="min-h-dvh bg-background p-4 md:p-8"><div className="max-w-2xl space-y-4"><h1 className="text-xl font-semibold">Profile</h1><AppDownloads /><LoadingSpinner className="h-10 w-24 text-primary" /></div></main>;
}
