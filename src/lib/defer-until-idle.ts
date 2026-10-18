type Scheduler = Pick<Window, "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout"> &
  Partial<Pick<Window, "requestIdleCallback" | "cancelIdleCallback">>;

/** Keep optional installation/update work off the document's critical load path. */
export function deferUntilIdle(task: () => void, host: Scheduler = window, loaded = document.readyState === "complete") {
  let idle: number | undefined;
  let timer: number | undefined;
  let cancelled = false;
  const run = () => { if (!cancelled) task(); };
  const schedule = () => {
    if (cancelled) return;
    if (host.requestIdleCallback) idle = host.requestIdleCallback(run, { timeout: 1500 });
    else timer = host.setTimeout(run, 0);
  };
  if (loaded) schedule();
  else host.addEventListener("load", schedule, { once: true });
  return () => {
    cancelled = true;
    host.removeEventListener("load", schedule);
    if (idle !== undefined) host.cancelIdleCallback?.(idle);
    if (timer !== undefined) host.clearTimeout(timer);
  };
}
