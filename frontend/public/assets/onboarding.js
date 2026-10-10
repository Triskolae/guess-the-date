document.addEventListener("DOMContentLoaded", async () => {
  const baseUrl = window.API_URL || "";

  // Éléments du DOM
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const step3 = document.getElementById("step-3");
  const step4 = document.getElementById("step-4");

  const btnToStep2 = document.getElementById("btn-to-step-2");
  const btnBackTo1 = document.getElementById("btn-back-to-1");
  const btnToStep3 = document.getElementById("btn-to-step-3");
  const btnBackTo2 = document.getElementById("btn-back-to-2");

  const onboardingForm = document.getElementById("onboarding-form");

  // --- 1. Navigation entre les étapes ---
  function goToStep(showStep) {
    [step1, step2, step3, step4].forEach((s) => s?.classList.add("hidden"));
    showStep?.classList.remove("hidden");
  }

  btnToStep2?.addEventListener("click", () => goToStep(step2));
  btnBackTo1?.addEventListener("click", () => goToStep(step1));

  btnToStep3?.addEventListener("click", () => {
    const selectedEra = document.querySelector('input[name="era_id"]:checked');
    if (!selectedEra) {
      alert("Veuillez sélectionner une époque.");
      return;
    }
    goToStep(step3);
  });

  btnBackTo2?.addEventListener("click", () => goToStep(step2));

  // --- 2. Chargement des données (Eras & Categories) ---
  try {
    const response = await fetch(`${baseUrl}/api/onboarding/options`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erreur de chargement des options.");

    const { eras, categories } = await response.json();

    renderEras(eras);
    renderCategories(categories);
  } catch (error) {
    console.error("Erreur onboarding :", error);
  }

  // --- 3. Rendu des Époques (Boutons Radio) ---
  function renderEras(eras) {
    const container = document.getElementById("eras-container");
    if (!container) return;

    container.innerHTML = eras
      .map(
        (era, index) => `
        <label class="option-card">
          <input type="radio" name="era_id" value="${era.id}" ${index === 0 ? "checked" : ""} />
          <div class="card-content">
            <span class="card-title">${era.name}</span>
            <span class="card-subtitle">${formatEraYears(era.start_year, era.end_year)}</span>
          </div>
        </label>
      `
      )
      .join("");
  }

  function formatEraYears(start, end) {
    if (start === null && end !== null) return `Avant ${end}`;
    if (start !== null && end === null) return `Depuis ${start}`;
    if (start !== null && end !== null) return `${start} à ${end}`;
    return "";
  }

  // --- 4. Rendu des Catégories (Checkboxes - Max 3) ---
  function renderCategories(categories) {
    const container = document.getElementById("categories-container");
    if (!container) return;

    container.innerHTML = categories
      .map(
        (cat) => `
        <label class="option-card">
          <input type="checkbox" name="category_ids" value="${cat.id}" class="category-checkbox" />
          <div class="card-content">
            <span class="card-title">${cat.name}</span>
          </div>
        </label>
      `
      )
      .join("");

    // Limitation stricte à 3 sélections max
    const checkboxes = container.querySelectorAll(".category-checkbox");
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        const checkedCount = container.querySelectorAll(".category-checkbox:checked").length;
        if (checkedCount >= 3) {
          checkboxes.forEach((box) => {
            if (!box.checked) box.disabled = true;
          });
        } else {
          checkboxes.forEach((box) => (box.disabled = false));
        }
      });
    });
  }

  // --- 5. Soumission du Formulaire ---
  if (onboardingForm) {
    onboardingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const gameMode = document.querySelector('input[name="game_mode"]:checked')?.value;
      const selectedEraId = parseInt(
        document.querySelector('input[name="era_id"]:checked')?.value,
        10
      );
      const selectedCategoryIds = Array.from(
        document.querySelectorAll('input[name="category_ids"]:checked')
      ).map((cb) => parseInt(cb.value, 10));

      if (!selectedEraId) {
        alert("Veuillez choisir une époque.");
        return;
      }

      if (selectedCategoryIds.length === 0 || selectedCategoryIds.length > 3) {
        alert("Veuillez choisir entre 1 et 3 catégories.");
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/user/preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            game_mode: gameMode,
            era_ids: [selectedEraId], // Transmis en tableau pour réutiliser la même route API
            category_ids: selectedCategoryIds,
          }),
        });

        if (response.ok) {
          // Affichage du message de confirmation (Étape 4)
          goToStep(step4);
        } else {
          const data = await response.json();
          alert(data.message || "Erreur lors de l'enregistrement.");
        }
      } catch (error) {
        console.error("Erreur de sauvegarde :", error);
        alert("Erreur réseau lors de la sauvegarde.");
      }
    });
  }
});
