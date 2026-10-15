(() => {
  const input = document.getElementById("profile-photo-input");
  const image = document.getElementById("profile-avatar-image");
  const placeholder = document.getElementById("profile-avatar-placeholder");
  const removeButton = document.getElementById("profile-photo-remove");
  const feedback = document.getElementById("profile-photo-feedback");
  const storageKey = "guessTheDate.profilePhoto";

  if (!input || !image || !placeholder || !removeButton || !feedback) return;

  function showPhoto(dataUrl) {
    image.src = dataUrl;
    image.classList.remove("hidden");
    placeholder.classList.add("hidden");
    removeButton.classList.remove("hidden");
  }

  function clearPhoto() {
    image.removeAttribute("src");
    image.classList.add("hidden");
    placeholder.classList.remove("hidden");
    removeButton.classList.add("hidden");
  }

  try {
    const savedPhoto = localStorage.getItem(storageKey);
    if (savedPhoto) showPhoto(savedPhoto);
  } catch {
    feedback.textContent = "Photo storage is unavailable in this browser.";
  }

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      feedback.textContent = "Choose an image file.";
      input.value = "";
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      feedback.textContent = "Choose an image smaller than 12 MB.";
      input.value = "";
      return;
    }

    const sourceUrl = URL.createObjectURL(file);
    const sourceImage = new Image();

    sourceImage.onload = () => {
      try {
        const scale = Math.min(1, 512 / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
        canvas.getContext("2d").drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/webp", 0.82);
        localStorage.setItem(storageKey, dataUrl);
        showPhoto(dataUrl);
        feedback.textContent = "Photo saved in this browser.";
      } catch {
        feedback.textContent = "The photo could not be saved in this browser.";
      } finally {
        URL.revokeObjectURL(sourceUrl);
        input.value = "";
      }
    };

    sourceImage.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      input.value = "";
      feedback.textContent = "This image could not be opened.";
    };

    sourceImage.src = sourceUrl;
  });

  removeButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
      clearPhoto();
      feedback.textContent = "Profile photo removed.";
    } catch {
      feedback.textContent = "The photo could not be removed from this browser.";
    }
  });
})();
