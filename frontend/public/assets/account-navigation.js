(() => {
  const button = document.querySelector(".about-menu-toggle");
  const menu = document.querySelector("#about-navigation");

  if (!button || !menu) return;

  function setOpen(open) {
    menu.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  button.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", event => {
    if (!button.contains(event.target) && !menu.contains(event.target)) setOpen(false);
  });
  menu.addEventListener("click", event => {
    if (event.target.closest("a")) setOpen(false);
  });
})();
