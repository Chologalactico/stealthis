function imageZoom(imgID, lensID, resultID) {
  const img = document.querySelector(`#${imgID} img`);
  const lens = document.getElementById(lensID);
  const result = document.getElementById(resultID);

  /* Calculate ratios */
  const cx = result.offsetWidth / lens.offsetWidth;
  const cy = result.offsetHeight / lens.offsetHeight;

  /* Set background properties for result */
  result.style.backgroundImage = `url('${img.src}')`;
  result.style.backgroundSize = `${img.width * cx}px ${img.height * cy}px`;

  /* Event Listeners */
  img.addEventListener("mousemove", moveLens);
  lens.addEventListener("mousemove", moveLens);
  
  img.addEventListener("mouseenter", () => {
    lens.style.display = "block";
    result.style.display = "block";
  });
  
  img.addEventListener("mouseleave", () => {
    lens.style.display = "none";
    result.style.display = "none";
  });

  function moveLens(e) {
    e.preventDefault();
    const pos = getCursorPos(e);
    
    /* Calculate position of lens */
    let x = pos.x - (lens.offsetWidth / 2);
    let y = pos.y - (lens.offsetHeight / 2);
    
    /* Prevent lens from being outside the image */
    if (x > img.width - lens.offsetWidth) { x = img.width - lens.offsetWidth; }
    if (x < 0) { x = 0; }
    if (y > img.height - lens.offsetHeight) { y = img.height - lens.offsetHeight; }
    if (y < 0) { y = 0; }
    
    /* Set lens position */
    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;
    
    /* Display what the lens "sees" */
    result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
  }

  function getCursorPos(e) {
    const a = img.getBoundingClientRect();
    const x = e.pageX - a.left - window.pageXOffset;
    const y = e.pageY - a.top - window.pageYOffset;
    return { x, y };
  }
}

// Init
window.addEventListener('load', () => {
    imageZoom("magnifier-target", "magnifier-lens", "magnifier-result");
});
