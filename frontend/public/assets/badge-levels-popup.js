(() => {
  const levelDetails = document.querySelectorAll(".badge-levels-details");
  const html = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let savedScrollY = 0;
  let savedBodyStyles = null;
  let savedHtmlOverflow = "";

  const syncScrollLock = () => {
    const shouldLock = [...levelDetails].some((details) => details.open);

    if (shouldLock && !savedBodyStyles) {
      savedScrollY = window.scrollY;
      savedBodyStyles = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
      };
      savedHtmlOverflow = html.style.overflow;
      body.style.position = "fixed";
      body.style.top = `-${savedScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      html.style.overflow = "hidden";
    } else if (!shouldLock && savedBodyStyles) {
      Object.assign(body.style, savedBodyStyles);
      html.style.overflow = savedHtmlOverflow;
      savedBodyStyles = null;
      window.scrollTo(0, savedScrollY);
    }
  };

  levelDetails.forEach((details) => {
    details.addEventListener("toggle", () => {
      syncScrollLock();
      const popup = details.querySelector(".badge-levels-popup");
      if (!popup) return;

      popup.classList.remove("is-opening", "is-closing");
      if (details.open) {
        void popup.offsetWidth;
        requestAnimationFrame(() => {
          if (details.open) popup.classList.add("is-opening");
        });
      }
    });
  });

  const animateClose = (details) => {
    const popup = details.querySelector(".badge-levels-popup");
    if (!details.open || !popup || popup.classList.contains("is-closing")) return;

    if (reduceMotion.matches) {
      details.open = false;
      return;
    }

    popup.classList.remove("is-opening");
    void popup.offsetWidth;
    popup.classList.add("is-closing");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      popup.removeEventListener("animationend", onAnimationEnd);
      popup.classList.remove("is-closing");
      if (details.open) details.open = false;
    };
    const onAnimationEnd = (event) => {
      if (event.target === popup) finish();
    };

    popup.addEventListener("animationend", onAnimationEnd);
    window.setTimeout(finish, 900);
  };

  const closeOpenPopups = (except = null) => {
    levelDetails.forEach((details) => {
      if (details !== except && details.open) animateClose(details);
    });
    syncScrollLock();
  };

  document.addEventListener("click", (event) => {
    const summary = event.target.closest?.(".badge-levels-details summary");

    if (summary) {
      const details = summary.closest("details");
      closeOpenPopups(details);
      if (details?.open) {
        event.preventDefault();
        animateClose(details);
      }
      return;
    }

    closeOpenPopups();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOpenPopups();
  });
})();
