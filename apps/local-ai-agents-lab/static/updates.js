(() => {
  const button = document.getElementById("update-check");
  const status = document.getElementById("update-status");
  if (!button || !status) return;

  const setStatus = (message, linkUrl, linkLabel) => {
    status.replaceChildren(document.createTextNode(message));
    if (linkUrl && linkLabel) {
      const link = document.createElement("a");
      link.href = linkUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = linkLabel;
      status.append(" ", link);
    }
  };

  button.addEventListener("click", async () => {
    button.disabled = true;
    setStatus("Checking the official release… / Έλεγχος της επίσημης έκδοσης…");
    try {
      const response = await fetch("/api/updates", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update check failed.");
      if (data.available) {
        const url = data.downloadUrl || data.releaseUrl;
        const label = data.downloadUrl ? "Download the ZIP" : "Open the release";
        setStatus(
          `Version ${data.latestVersion} is available. Download and install it manually. / Η έκδοση ${data.latestVersion} είναι διαθέσιμη. Κατέβασέ την και εγκατέστησέ την χειροκίνητα.`,
          url,
          label,
        );
      } else {
        setStatus(`You already have the latest version (${data.currentVersion}). / Έχεις ήδη την τελευταία έκδοση (${data.currentVersion}).`);
      }
    } catch (error) {
      setStatus(`Update check failed. No files were changed. / Ο έλεγχος απέτυχε. Δεν άλλαξε κανένα αρχείο. ${error.message || ""}`.trim());
    } finally {
      button.disabled = false;
    }
  });
})();
