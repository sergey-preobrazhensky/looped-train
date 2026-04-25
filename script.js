const carCountInput = document.querySelector("#car-count");
const lightActionButtons = document.querySelectorAll("[data-light-action]");
const moveButtons = document.querySelectorAll("[data-move]");
const currentLightToggleButton = document.querySelector("[data-current-light-toggle]");
const algorithmOneButton = document.querySelector("[data-algorithm='one']");
const algorithmTwoButton = document.querySelector("[data-algorithm='two']");
const algorithmThreeButton = document.querySelector("[data-algorithm='three']");
const animationDelayInput = document.querySelector("#animation-delay");
const speedStepButtons = document.querySelectorAll("[data-speed-step]");
const stopAlgorithmButton = document.querySelector("[data-stop-algorithm]");
const resetAlgorithmButton = document.querySelector("[data-reset-algorithm]");
const algorithmIndicator = document.querySelector("#algorithm-indicator");
const train = document.querySelector("#train");
const summary = document.querySelector("#summary");

const MIN_CARS = Number(carCountInput.min);
const MAX_CARS = Number(carCountInput.max);
const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_SIZE = 1000;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 390;
const LOW_ANIMATION_DELAYS = [0, 1, 50, 100];
const ANIMATION_DELAYS = [
  ...LOW_ANIMATION_DELAYS,
  ...Array.from({ length: 19 }, (_, index) => (index + 2) * 100),
];
const MAX_ANIMATION_DELAY = 2000;

let lightStates = [];
let visitedCars = [];
let currentCarIndex = 0;
let totalSteps = 0;
let currentCarCount = null;
let algorithmRunning = false;
let algorithmStatus = "";
let algorithmResult = null;
let algorithmResultLabel = "Simple Algorithm answer";
let animationDelay = 500;
let algorithmStartSnapshot = null;
let shouldRenderAlgorithmSteps = true;

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

function getAnimationDelay() {
  return animationDelay;
}

function updateSpeedIndicator() {
  animationDelayInput.value = ANIMATION_DELAYS.length - 1 - ANIMATION_DELAYS.indexOf(animationDelay);
}

function setAnimationDelay(delay) {
  animationDelay = clamp(delay, 0, MAX_ANIMATION_DELAY);
  shouldRenderAlgorithmSteps = animationDelay > 0;
  updateSpeedIndicator();
}

function changeSpeed(step) {
  const currentSpeedIndex = Number(animationDelayInput.value);
  const nextSpeedIndex = clamp(currentSpeedIndex + step, 0, ANIMATION_DELAYS.length - 1);
  const delayIndex = ANIMATION_DELAYS.length - 1 - nextSpeedIndex;

  setAnimationDelay(ANIMATION_DELAYS[delayIndex]);
}

function createStateSnapshot() {
  return {
    carCount: carCountInput.value,
    lightStates: [...lightStates],
  };
}

function setResetSnapshotFromCurrentLights() {
  algorithmRunning = false;
  currentCarIndex = 0;
  visitedCars = Array(lightStates.length).fill(false);
  totalSteps = 0;
  currentCarCount = lightStates.length;
  algorithmStatus = "";
  algorithmResult = null;
  algorithmResultLabel = "Simple Algorithm answer";
  algorithmStartSnapshot = createStateSnapshot();
  updateResetButton();
}

function updateResetButton() {
  resetAlgorithmButton.disabled = !algorithmStartSnapshot;
}

function stopAlgorithm() {
  if (!algorithmRunning) {
    return;
  }

  algorithmRunning = false;
  algorithmStatus = "Algorithm stopped";
  algorithmIndicator.hidden = true;
  setControlsDisabled(false);
  renderTrain();
}

function resetToAlgorithmStart() {
  if (!algorithmStartSnapshot) {
    return;
  }

  algorithmRunning = false;
  carCountInput.value = algorithmStartSnapshot.carCount;
  lightStates = [...algorithmStartSnapshot.lightStates];
  visitedCars = Array(lightStates.length).fill(false);
  currentCarIndex = 0;
  totalSteps = 0;
  currentCarCount = lightStates.length;
  algorithmStatus = "";
  algorithmResult = null;
  algorithmResultLabel = "Simple Algorithm answer";
  algorithmIndicator.hidden = true;
  setControlsDisabled(false);
  renderTrain();
}

function prepareAlgorithmStart() {
  if (algorithmStartSnapshot) {
    resetToAlgorithmStart();
  }

  setResetSnapshotFromCurrentLights();
}

function setControlsDisabled(disabled) {
  [
    carCountInput,
    currentLightToggleButton,
    algorithmOneButton,
    algorithmTwoButton,
    algorithmThreeButton,
    ...lightActionButtons,
    ...moveButtons,
  ].forEach((control) => {
    control.disabled = disabled;
  });

  stopAlgorithmButton.disabled = !disabled;
  updateResetButton();
}

function setAllLights(isOn) {
  lightStates = lightStates.map(() => isOn);
  setResetSnapshotFromCurrentLights();
  renderTrain();
}

function randomizeLights() {
  lightStates = lightStates.map(() => Math.random() >= 0.5);
  setResetSnapshotFromCurrentLights();
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

async function animateAlgorithmStep() {
  const delay = getAnimationDelay();

  if (delay === 0 || !shouldRenderAlgorithmSteps) {
    return;
  }

  renderTrain();
  await sleep(delay);
}

async function algorithmMove(step) {
  moveCurrentCarWithoutRender(step);

  await animateAlgorithmStep();
}

async function moveSteps(step, steps) {
  for (let index = 0; index < steps; index += 1) {
    if (!algorithmRunning) {
      break;
    }

    await algorithmMove(step);
  }
}

async function runAlgorithmOne() {
  if (algorithmRunning) {
    return;
  }

  prepareAlgorithmStart();
  algorithmRunning = true;
  algorithmStatus = "Simple Algorithm: running";
  algorithmResult = null;
  algorithmResultLabel = "Simple Algorithm answer";
  setControlsDisabled(true);
  algorithmIndicator.hidden = false;

  const count = clamp(Number(carCountInput.value) || MIN_CARS, MIN_CARS, MAX_CARS);
  shouldRenderAlgorithmSteps = getAnimationDelay() > 0;

  carCountInput.value = count;
  syncLightStates(count);
  resetTraversal(count);
  renderTrain();
  await animateAlgorithmStep();
  await sleep(40);

  while (algorithmRunning) {
    let countedCars = 0;

    lightStates[currentCarIndex] = true;
    await animateAlgorithmStep();

    if (!algorithmRunning) {
      break;
    }

    do {
      await algorithmMove(1);
      countedCars += 1;
    } while (algorithmRunning && !lightStates[currentCarIndex]);

    if (!algorithmRunning) {
      break;
    }

    lightStates[currentCarIndex] = false;
    await animateAlgorithmStep();

    for (let step = 0; step < countedCars; step += 1) {
      await algorithmMove(-1);
    }

    await animateAlgorithmStep();

    if (!lightStates[currentCarIndex]) {
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

async function moveUntilLightState(step, isOn) {
  let distance = 0;

  do {
    await algorithmMove(step);
    distance += 1;
  } while (algorithmRunning && lightStates[currentCarIndex] !== isOn);

  return distance;
}

async function runAlgorithmTwo() {
  if (algorithmRunning) {
    return;
  }

  prepareAlgorithmStart();
  algorithmRunning = true;
  algorithmStatus = "Bidirectional Algorithm: running";
  algorithmResult = null;
  algorithmResultLabel = "Bidirectional Algorithm answer";
  setControlsDisabled(true);
  algorithmIndicator.hidden = false;

  const count = clamp(Number(carCountInput.value) || MIN_CARS, MIN_CARS, MAX_CARS);
  shouldRenderAlgorithmSteps = getAnimationDelay() > 0;

  carCountInput.value = count;
  syncLightStates(count);
  resetTraversal(count);
  renderTrain();
  await animateAlgorithmStep();
  await sleep(40);

  if (!algorithmRunning) {
    setControlsDisabled(false);
    algorithmIndicator.hidden = true;
    renderTrain();
    return;
  }

  lightStates[currentCarIndex] = true;
  await animateAlgorithmStep();

  if (!algorithmRunning) {
    setControlsDisabled(false);
    algorithmIndicator.hidden = true;
    renderTrain();
    return;
  }

  let rightDistance = await moveUntilLightState(1, true);

  if (!algorithmRunning) {
    setControlsDisabled(false);
    algorithmIndicator.hidden = true;
    renderTrain();
    return;
  }

  lightStates[currentCarIndex] = false;
  await animateAlgorithmStep();
  await moveSteps(-1, rightDistance);
  await animateAlgorithmStep();

  if (!algorithmRunning) {
    setControlsDisabled(false);
    algorithmIndicator.hidden = true;
    renderTrain();
    return;
  }

  if (!lightStates[currentCarIndex]) {
    algorithmResult = rightDistance;
    algorithmStatus = "Bidirectional Algorithm: complete";
  } else {
    let leftDistance = 0;

    while (algorithmRunning) {
      leftDistance += await moveUntilLightState(-1, false);

      if (!algorithmRunning) {
        break;
      }

      lightStates[currentCarIndex] = true;
      await animateAlgorithmStep();
      await moveSteps(1, leftDistance + rightDistance);

      if (!algorithmRunning) {
        break;
      }

      if (lightStates[currentCarIndex]) {
        algorithmResult = leftDistance + rightDistance;
        algorithmStatus = "Bidirectional Algorithm: complete";
        break;
      }

      rightDistance += await moveUntilLightState(1, true);

      if (!algorithmRunning) {
        break;
      }

      lightStates[currentCarIndex] = false;
      await animateAlgorithmStep();
      await moveSteps(-1, leftDistance + rightDistance);

      if (!algorithmRunning) {
        break;
      }

      if (!lightStates[currentCarIndex]) {
        algorithmResult = leftDistance + rightDistance;
        algorithmStatus = "Bidirectional Algorithm: complete";
        break;
      }
    }
  }

  algorithmRunning = false;
  setControlsDisabled(false);
  algorithmIndicator.hidden = true;
  renderTrain();
}

async function runAlgorithmThree() {
  if (algorithmRunning) {
    return;
  }

  prepareAlgorithmStart();
  algorithmRunning = true;
  algorithmStatus = "Forward Scan Algorithm: running";
  algorithmResult = null;
  algorithmResultLabel = "Forward Scan Algorithm answer";
  setControlsDisabled(true);
  algorithmIndicator.hidden = false;

  const count = clamp(Number(carCountInput.value) || MIN_CARS, MIN_CARS, MAX_CARS);
  shouldRenderAlgorithmSteps = getAnimationDelay() > 0;

  carCountInput.value = count;
  syncLightStates(count);
  resetTraversal(count);
  renderTrain();
  await animateAlgorithmStep();
  await sleep(40);

  while (algorithmRunning) {
    let rememberedOffCars = 0;

    lightStates[currentCarIndex] = true;
    await animateAlgorithmStep();

    if (!algorithmRunning) {
      break;
    }

    do {
      await algorithmMove(1);
      rememberedOffCars += 1;
    } while (algorithmRunning && !lightStates[currentCarIndex]);

    if (!algorithmRunning) {
      break;
    }

    lightStates[currentCarIndex] = false;
    await animateAlgorithmStep();

    while (algorithmRunning) {
      let offCarsFromCurrent = 0;

      do {
        await algorithmMove(1);
        offCarsFromCurrent += 1;
      } while (algorithmRunning && offCarsFromCurrent <= rememberedOffCars && !lightStates[currentCarIndex]);

      if (!algorithmRunning) {
        break;
      }

      if (lightStates[currentCarIndex]) {
        rememberedOffCars += offCarsFromCurrent;
        lightStates[currentCarIndex] = false;
        await animateAlgorithmStep();
        continue;
      }

      await moveSteps(-1, rememberedOffCars + offCarsFromCurrent);

      if (!algorithmRunning) {
        break;
      }

      if (!lightStates[currentCarIndex]) {
        algorithmResult = rememberedOffCars;
        algorithmStatus = "Forward Scan Algorithm: complete";
        algorithmRunning = false;
      }

      break;
    }
  }

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
  const algorithmResultLine = algorithmResult === null ? "" : `<br>${algorithmResultLabel}: ${algorithmResult}`;
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
  algorithmStartSnapshot = null;
  updateResetButton();
  renderTrain();
  setResetSnapshotFromCurrentLights();
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
algorithmTwoButton.addEventListener("click", () => {
  runAlgorithmTwo();
});
algorithmThreeButton.addEventListener("click", () => {
  runAlgorithmThree();
});
animationDelayInput.addEventListener("input", () => {
  const delayIndex = ANIMATION_DELAYS.length - 1 - Number(animationDelayInput.value);

  setAnimationDelay(ANIMATION_DELAYS[delayIndex]);
  renderTrain();
});
speedStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeSpeed(Number(button.dataset.speedStep));
    renderTrain();
  });
});
stopAlgorithmButton.addEventListener("click", () => {
  stopAlgorithm();
});
resetAlgorithmButton.addEventListener("click", () => {
  resetToAlgorithmStart();
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
  setResetSnapshotFromCurrentLights();
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

updateSpeedIndicator();
setControlsDisabled(false);
renderTrain();
setResetSnapshotFromCurrentLights();
