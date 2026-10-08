const menuToggle = document.querySelector(".auth-menu-toggle");
const navigation = document.querySelector(".auth-navigation");

const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");

const loginPanel = document.querySelector("#login-panel");
const registerPanel = document.querySelector("#register-panel");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
});

function showAuthPanel(activeTab, activePanel, inactiveTab, inactivePanel) {
  activeTab.classList.add("active");
  activeTab.setAttribute("aria-selected", "true");
  activePanel.classList.remove("hidden");

  inactiveTab.classList.remove("active");
  inactiveTab.setAttribute("aria-selected", "false");
  inactivePanel.classList.add("hidden");
}

loginTab.addEventListener("click", () => {
  showAuthPanel(loginTab, loginPanel, registerTab, registerPanel);
});

registerTab.addEventListener("click", () => {
  showAuthPanel(registerTab, registerPanel, loginTab, loginPanel);
});

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("tab") === "register") {
  showAuthPanel(registerTab, registerPanel, loginTab, loginPanel);
}

document.querySelectorAll(".logo-sparkle").forEach((sparkle) => {
  function triggerSparkle() {
    sparkle.classList.add("sparkle-active");

    setTimeout(() => {
      sparkle.classList.remove("sparkle-active");

      const delay = 1500 + Math.random() * 4500;
      setTimeout(triggerSparkle, delay);
    }, 700);
  }

  const initialDelay = Math.random() * 3000;
  setTimeout(triggerSparkle, initialDelay);
});

const loginForm = document.querySelector("#page-login-form");
const authFeedback = document.querySelector("#page-auth-feedback");

function showAuthFeedback(message, type = "error") {
  authFeedback.textContent = message;
  authFeedback.classList.remove("hidden");
  authFeedback.dataset.type = type;
}

function clearAuthFeedback() {
  authFeedback.textContent = "";
  authFeedback.classList.add("hidden");
  delete authFeedback.dataset.type;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthFeedback();

  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;

  try {
    const response = await fetch(`${window.API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthFeedback(data.message || "Unable to log in.");
      return;
    }

    window.location.href = "game.html";
  } catch (error) {
    console.error("Login error:", error);
    showAuthFeedback("Unable to connect to the server.");
  }
});