/* ============================================================
   LIQUID GLASS CONTROL CENTER — toggles + vertical drag sliders
   ============================================================ */

const status = document.getElementById("status");

function announce(text) {
  status.textContent = text;
}

/* ---------- Round toggles ---------- */
document.querySelectorAll(".disc").forEach((disc) => {
  disc.addEventListener("click", () => {
    const on = disc.classList.toggle("is-on");
    disc.setAttribute("aria-pressed", String(on));
    announce(`${disc.dataset.label} ${on ? "on" : "off"}`);
  });
});

/* ---------- Focus toggle ---------- */
const focusBtn = document.getElementById("focusBtn");
const focusState = document.getElementById("focusState");

focusBtn.addEventListener("click", () => {
  const on = focusBtn.getAttribute("aria-pressed") !== "true";
  focusBtn.setAttribute("aria-pressed", String(on));
  focusState.textContent = on ? "Do Not Disturb" : "Off";
  announce(`Focus ${on ? "on" : "off"}`);
});

/* ---------- Vertical sliders (pointer drag + keyboard) ---------- */
document.querySelectorAll(".vslider").forEach((slider) => {
  const fill = slider.querySelector(".vfill");
  const name = slider.dataset.slider;
  let value = Number(slider.getAttribute("aria-valuenow"));

  function setValue(next, announceIt = true) {
    value = Math.min(Math.max(next, 0), 100);
    fill.style.height = `${value}%`;
    slider.setAttribute("aria-valuenow", String(Math.round(value)));
    if (announceIt) announce(`${name} ${Math.round(value)}%`);
  }

  function fromPointer(e) {
    const rect = slider.getBoundingClientRect();
    setValue((1 - (e.clientY - rect.top) / rect.height) * 100);
  }

  slider.addEventListener("pointerdown", (e) => {
    slider.setPointerCapture(e.pointerId);
    fromPointer(e);
  });

  slider.addEventListener("pointermove", (e) => {
    if (slider.hasPointerCapture(e.pointerId)) fromPointer(e);
  });

  slider.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 10 : 5;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      setValue(value + step);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      setValue(value - step);
    }
  });
});
