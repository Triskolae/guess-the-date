(() => {
  const updatePercentage = (progress) => {
    const output = progress
      .closest(".badge-progress-row")
      ?.querySelector(".badge-progress-percent");

    if (!output) return;

    const max = Number(progress.max) || 1;
    const percentage = Math.round((progress.value / max) * 100);
    output.textContent = `${Math.min(100, Math.max(0, percentage))}%`;
  };

  document.querySelectorAll(".badge-progress").forEach((progress) => {
    updatePercentage(progress);

    new MutationObserver(() => updatePercentage(progress)).observe(progress, {
      attributes: true,
      attributeFilter: ["value", "max"],
    });
  });
})();
