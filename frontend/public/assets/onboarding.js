document.addEventListener("DOMContentLoaded", () => {
  let currentStep = 0;
  const totalSteps = 4;

  const steps = document.querySelectorAll(".step");
  const counter = document.getElementById("step-counter");
  const form = document.getElementById("onboarding-form");

  function updateCarousel() {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
    });

    if (currentStep === 0) {
      counter.textContent = "";
    } else {
      counter.textContent = `${currentStep} / ${totalSteps}`;
    }
  }

  document.querySelectorAll(".btn-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++;
          updateCarousel();
        }
      }
    });
  });

  document.querySelectorAll(".btn-prev").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        updateCarousel();
      }
    });
  });

  // Étape 1 : Conditionnel Compétitif
  const gameOpticInputs = document.querySelectorAll('input[name="gameOptic"]');
  const modePreference = document.getElementById("mode-preference");

  gameOpticInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      if (e.target.value === "competitif") {
        modePreference.classList.remove("hidden");
      } else {
        modePreference.classList.add("hidden");
        document
          .querySelectorAll('input[name="gameMode"]')
          .forEach((radio) => (radio.checked = false));
      }
    });
  });

  // Étape 3 : Limite à 3 catégories
  const categoryCheckboxes = document.querySelectorAll(
    'input[name="categories"]',
  );
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checkedCount = document.querySelectorAll(
        'input[name="categories"]:checked',
      ).length;
      if (checkedCount > 3) {
        checkbox.checked = false;
        alert("Vous pouvez sélectionner 3 catégories au maximum.");
      }
    });
  });

  function validateStep(stepIndex) {
    if (stepIndex === 1) {
      const selectedOptic = document.querySelector(
        'input[name="gameOptic"]:checked',
      );
      if (!selectedOptic) {
        alert("Veuillez sélectionner une optique de jeu.");
        return false;
      }
    }
    if (stepIndex === 2) {
      const selectedEra = document.querySelector('input[name="era"]:checked');
      if (!selectedEra) {
        alert("Veuillez sélectionner une époque.");
        return false;
      }
    }
    return true;
  }

  // Envoi API
  async function submitPreferences(targetUrl) {
    const formData = new FormData(form);
    const payload = {
      gameOptic: formData.get("gameOptic"),
      gameMode: formData.get("gameMode") || null,
      era: formData.get("era"),
      categories: formData.getAll("categories"),
    };

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erreur serveur lors de la sauvegarde");
      }

      window.location.href = targetUrl;
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors de l'enregistrement de vos choix.");
    }
  }

  document.getElementById("go-game").addEventListener("click", () => {
    submitPreferences("/game");
  });

  document.getElementById("go-home").addEventListener("click", () => {
    submitPreferences("/home");
  });

  updateCarousel();
});
