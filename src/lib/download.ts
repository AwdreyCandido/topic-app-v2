import type { Backup } from "@/data/types";

export function downloadBackup(backup: Backup, prefix = "topic-backup") {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    prefix + "-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}
