(() => {
  const levelDetails = document.querySelectorAll(".badge-levels-details");

  const closeOpenPopups = (except = null) => {
    levelDetails.forEach((details) => {
      if (details !== except && details.open) details.open = false;
    });
  };

  document.addEventListener("click", (event) => {
    const summary = event.target.closest?.(".badge-levels-details summary");

    if (summary) {
      closeOpenPopups(summary.closest("details"));
      return;
    }

    closeOpenPopups();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOpenPopups();
  });
})();
