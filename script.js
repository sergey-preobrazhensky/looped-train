const carCountInput = document.querySelector("#car-count");
const lightActionButtons = document.querySelectorAll("[data-light-action]");
const moveButtons = document.querySelectorAll("[data-move]");
const currentLightToggleButton = document.querySelector("[data-current-light-toggle]");
const train = document.querySelector("#train");
const summary = document.querySelector("#summary");

const MIN_CARS = Number(carCountInput.min);
const MAX_CARS = Number(carCountInput.max);
const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_SIZE = 1000;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 390;

let lightStates = [];
let currentCarIndex = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function getArcPath(startAngle, endAngle) {
  const start = getPointOnCircle(startAngle);
  const end = getPointOnCircle(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function getCarWidth(count) {
  return clamp(520 / Math.sqrt(count), 5, 76);
}

function getGapAngle(count) {
  if (count === 1) {
    return 0;
  }

  return Math.min(2.6, 24 / count);
}

function createJoint(angle, carWidth) {
  const halfWidth = carWidth / 2;
  const inner = getPointOnCircle(angle, RADIUS - halfWidth);
  const outer = getPointOnCircle(angle, RADIUS + halfWidth);
  const jointWidth = clamp(carWidth * 0.18, 1.5, 12);

  return createSvgElement("line", {
    class: "car-joint",
    x1: inner.x,
    y1: inner.y,
    x2: outer.x,
    y2: outer.y,
    "stroke-width": jointWidth,
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
    lightStates.push(true);
  }
}

function syncCurrentCar(count) {
  currentCarIndex = clamp(currentCarIndex, 0, count - 1);
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
  renderTrain();
}

function setCurrentLight(isOn) {
  lightStates[currentCarIndex] = isOn;
  renderTrain();
}

function toggleCurrentLight() {
  setCurrentLight(!lightStates[currentCarIndex]);
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
  syncCurrentCar(count);
  const lightsOn = lightStates.filter(Boolean).length;
  train.replaceChildren();

  for (let index = 0; index < count; index += 1) {
    const startAngle = -90 + segmentAngle * index + gapAngle / 2;
    const endAngle = -90 + segmentAngle * (index + 1) - gapAngle / 2;
    const jointAngle = -90 + segmentAngle * index;
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
    svg.append(car);
    svg.append(createJoint(jointAngle, carWidth));

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
  summary.innerHTML = `<strong>${count}</strong>${count === 1 ? "car" : "cars"} connected in a loop<br>${lightsOn} lights on<br>Current car: ${currentCarIndex + 1} (${lightStates[currentCarIndex] ? "on" : "off"})`;
}

carCountInput.addEventListener("input", renderTrain);
lightActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
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
    moveCurrentCar(Number(button.dataset.move));
  });
});
currentLightToggleButton.addEventListener("click", () => {
  toggleCurrentLight();
});
window.addEventListener("resize", renderTrain);

renderTrain();
