const carCountInput = document.querySelector("#car-count");
const lightActionButtons = document.querySelectorAll("[data-light-action]");
const moveButtons = document.querySelectorAll("[data-move]");
const currentLightToggleButton = document.querySelector("[data-current-light-toggle]");
const algorithmOneButton = document.querySelector("[data-algorithm='one']");
const algorithmIndicator = document.querySelector("#algorithm-indicator");
const train = document.querySelector("#train");
const summary = document.querySelector("#summary");

const MIN_CARS = Number(carCountInput.min);
const MAX_CARS = Number(carCountInput.max);
const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_SIZE = 1000;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 390;

let lightStates = [];
let visitedCars = [];
let currentCarIndex = 0;
let totalSteps = 0;
let currentCarCount = null;
let algorithmRunning = false;
let algorithmStatus = "";
let algorithmResult = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sleep(delay) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

function getPointOnCircle(angle, radius = RADIUS) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function getArcPath(startAngle, endAngle, radius = RADIUS) {
  const start = getPointOnCircle(startAngle, radius);
  const end = getPointOnCircle(endAngle, radius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function getCarWidth(count) {
  return clamp(520 / Math.sqrt(count), 5, 76);
}

function getGapAngle(count) {
  if (count === 1) {
    return 0;
  }

  return Math.min(3, 18 / count);
}

function createVisitedMarker(startAngle, endAngle, carWidth, count) {
  const markerRadius = RADIUS - carWidth / 2 - 9;
  const markerWidth = clamp(carWidth * 0.14, 2, 8);

  if (count === 1) {
    return createSvgElement("circle", {
      class: "visited-marker",
      cx: CENTER,
      cy: CENTER,
      r: markerRadius,
      "stroke-width": markerWidth,
    });
  }

  return createSvgElement("path", {
    class: "visited-marker",
    d: getArcPath(startAngle, endAngle, markerRadius),
    "stroke-width": markerWidth,
  });
}

function createPersonMarker(angle, carWidth) {
  const markerRadius = RADIUS - Math.max(carWidth / 2 + 24, 34);
  const position = getPointOnCircle(angle, markerRadius);
  const marker = createSvgElement("g", {
    class: "person-marker",
    transform: `translate(${position.x} ${position.y})`,
    "aria-label": `Person in car ${currentCarIndex + 1}`,
  });
  const badge = createSvgElement("circle", {
    class: "person-marker__badge",
    cx: 0,
    cy: 0,
    r: 26,
  });
  const head = createSvgElement("circle", {
    class: "person-marker__head",
    cx: 0,
    cy: -8,
    r: 7,
  });
  const body = createSvgElement("path", {
    class: "person-marker__body",
    d: "M -12 15 Q 0 3 12 15 Z",
  });

  marker.append(badge, head, body);

  return marker;
}

function syncLightStates(count) {
  if (lightStates.length > count) {
    lightStates = lightStates.slice(0, count);
    return;
  }

  while (lightStates.length < count) {
    lightStates.push(Math.random() >= 0.5);
  }
}

function syncCurrentCar(count) {
  currentCarIndex = clamp(currentCarIndex, 0, count - 1);
}

function resetTraversal(count) {
  syncCurrentCar(count);
  visitedCars = Array(count).fill(false);
  visitedCars[currentCarIndex] = true;
  totalSteps = 0;
  currentCarCount = count;
}

function getAnimationDelay(count) {
  return count <= 30 ? 160 : (count <= 100 ? 1 : 0);
}

function setControlsDisabled(disabled) {
  [
    carCountInput,
    currentLightToggleButton,
    algorithmOneButton,
    ...lightActionButtons,
    ...moveButtons,
  ].forEach((control) => {
    control.disabled = disabled;
  });
}

function setAllLights(isOn) {
  lightStates = lightStates.map(() => isOn);
  renderTrain();
}

function randomizeLights() {
  lightStates = lightStates.map(() => Math.random() >= 0.5);
  renderTrain();
}

function moveCurrentCar(step) {
  const count = lightStates.length;

  currentCarIndex = (currentCarIndex + step + count) % count;
  visitedCars[currentCarIndex] = true;
  totalSteps += 1;
  renderTrain();
}

function moveCurrentCarWithoutRender(step) {
  const count = lightStates.length;

  currentCarIndex = (currentCarIndex + step + count) % count;
  visitedCars[currentCarIndex] = true;
  totalSteps += 1;
}

function setCurrentLight(isOn) {
  lightStates[currentCarIndex] = isOn;
  renderTrain();
}

function toggleCurrentLight() {
  setCurrentLight(!lightStates[currentCarIndex]);
}

async function animateAlgorithmStep(delay) {
  renderTrain();

  if (delay > 0) {
    await sleep(delay);
  }
}

async function algorithmMove(step, delay) {
  moveCurrentCarWithoutRender(step);

  if (delay > 0) {
    await animateAlgorithmStep(delay);
  }
}

async function runAlgorithmOne() {
  if (algorithmRunning) {
    return;
  }

  algorithmRunning = true;
  algorithmStatus = "Simple Algorithm: running";
  algorithmResult = null;
  setControlsDisabled(true);
  algorithmIndicator.hidden = false;

  const count = clamp(Number(carCountInput.value) || MIN_CARS, MIN_CARS, MAX_CARS);
  const delay = getAnimationDelay(count);

  carCountInput.value = count;
  syncLightStates(count);
  resetTraversal(count);
  const firstCarIndex = currentCarIndex;
  await animateAlgorithmStep(delay);
  await sleep(40);

  while (algorithmRunning) {
    let countedCars = 0;

    lightStates[firstCarIndex] = true;
    await animateAlgorithmStep(delay);

    do {
      await algorithmMove(1, delay);
      countedCars += 1;
    } while (!lightStates[currentCarIndex]);

    lightStates[currentCarIndex] = false;
    await animateAlgorithmStep(delay);

    for (let step = 0; step < countedCars; step += 1) {
      await algorithmMove(-1, delay);
    }

    await animateAlgorithmStep(delay);

    if (!lightStates[firstCarIndex]) {
      algorithmResult = countedCars;
      algorithmStatus = "Simple Algorithm: complete";
      break;
    }
  }

  algorithmRunning = false;
  setControlsDisabled(false);
  algorithmIndicator.hidden = true;
  renderTrain();
}

function renderTrain() {
  const count = clamp(Number(carCountInput.value) || MIN_CARS, MIN_CARS, MAX_CARS);
  const segmentAngle = 360 / count;
  const gapAngle = getGapAngle(count);
  const carWidth = getCarWidth(count);
  const showLabels = count <= 24;
  const svg = createSvgElement("svg", {
    class: count > 120 ? "train-svg train-svg--dense" : "train-svg",
    viewBox: `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`,
    role: "img",
    "aria-label": `${count} ${count === 1 ? "car" : "cars"} connected in a loop`,
  });

  carCountInput.value = count;
  syncLightStates(count);
  if (currentCarCount !== count) {
    resetTraversal(count);
  } else {
    syncCurrentCar(count);
  }
  const lightsOn = lightStates.filter(Boolean).length;
  const visitedCount = visitedCars.filter(Boolean).length;
  const algorithmResultLine = algorithmResult === null ? "" : `<br>Simple Algorithm answer: ${algorithmResult}`;
  train.replaceChildren();

  for (let index = 0; index < count; index += 1) {
    const startAngle = -90 + segmentAngle * index + gapAngle / 2;
    const endAngle = -90 + segmentAngle * (index + 1) - gapAngle / 2;
    const car = count === 1
      ? createSvgElement("circle", {
        class: `car-segment car-segment--full${lightStates[index] ? "" : " car-segment--off"}`,
        cx: CENTER,
        cy: CENTER,
        r: RADIUS,
      })
      : createSvgElement("path", {
        class: `car-segment${lightStates[index] ? "" : " car-segment--off"}`,
        d: getArcPath(startAngle, endAngle),
      });

    car.style.setProperty("--car-width", carWidth);
    car.setAttribute("stroke-width", carWidth);
    car.setAttribute("aria-label", `Car ${index + 1}`);
    car.dataset.carIndex = index;
    svg.append(car);

    if (visitedCars[index]) {
      svg.append(createVisitedMarker(startAngle, endAngle, carWidth, count));
    }

    if (showLabels) {
      const labelAngle = -90 + segmentAngle * (index + 0.5);
      const labelPoint = getPointOnCircle(labelAngle);
      const label = createSvgElement("text", {
        class: "car-label",
        x: labelPoint.x,
        y: labelPoint.y,
      });

      label.textContent = index + 1;
      svg.append(label);
    }
  }

  const personAngle = -90 + segmentAngle * (currentCarIndex + 0.5);
  svg.append(createPersonMarker(personAngle, carWidth));

  train.append(svg);
  currentLightToggleButton.classList.toggle("is-on", lightStates[currentCarIndex]);
  currentLightToggleButton.setAttribute("aria-pressed", String(lightStates[currentCarIndex]));
  summary.innerHTML = `<strong>${count}</strong>${count === 1 ? "car" : "cars"} connected in a loop<br>${lightsOn} lights on<br>Current car: ${currentCarIndex + 1} (${lightStates[currentCarIndex] ? "on" : "off"})<br>Visited: ${visitedCount}/${count}<br>Steps: ${totalSteps}${algorithmStatus ? `<br>${algorithmStatus}` : ""}${algorithmResultLine}`;
}

carCountInput.addEventListener("input", () => {
  algorithmStatus = "";
  algorithmResult = null;
  renderTrain();
});
lightActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (algorithmRunning) {
      return;
    }

    const action = button.dataset.lightAction;

    if (action === "on") {
      setAllLights(true);
    }

    if (action === "off") {
      setAllLights(false);
    }

    if (action === "random") {
      randomizeLights();
    }
  });
});
moveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (algorithmRunning) {
      return;
    }

    moveCurrentCar(Number(button.dataset.move));
  });
});
currentLightToggleButton.addEventListener("click", () => {
  if (algorithmRunning) {
    return;
  }

  toggleCurrentLight();
});
algorithmOneButton.addEventListener("click", () => {
  runAlgorithmOne();
});
train.addEventListener("click", (event) => {
  if (algorithmRunning) {
    return;
  }

  const car = event.target.closest(".car-segment");

  if (!car) {
    return;
  }

  const carIndex = Number(car.dataset.carIndex);

  lightStates[carIndex] = !lightStates[carIndex];
  renderTrain();
});
document.addEventListener("keydown", (event) => {
  if (algorithmRunning || ["BUTTON", "INPUT"].includes(event.target.tagName)) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveCurrentCar(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveCurrentCar(1);
  }

  if (event.key === " ") {
    event.preventDefault();
    toggleCurrentLight();
  }
});
window.addEventListener("resize", renderTrain);

renderTrain();
