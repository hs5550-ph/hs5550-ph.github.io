document.addEventListener("DOMContentLoaded", () => {
  const hasSeenIntro = localStorage.getItem("hasSeenIntro");
  const overlay = document.getElementById("intro-overlay");
  const closeBtn = document.getElementById("intro-close-btn");

  if (!hasSeenIntro && overlay) {
    overlay.classList.remove("hidden");
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      localStorage.setItem("hasSeenIntro", "true");
      overlay.classList.add("hidden");
    });
  }
});
