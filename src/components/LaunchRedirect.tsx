"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LaunchRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Every launch enters the app; URL parameters must never pause startup.
    if (!navigator.onLine) {
      window.location.replace("/offline");
      return;
    }
    router.replace("/");
  }, [router]);

  return (
    <div className="launch-recovery">
      <p>Taking a little longer?</p>
      <a className="launch-open" href="/">Open Kivo</a>
    </div>
  );
}
