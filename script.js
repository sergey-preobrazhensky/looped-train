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
const algorithmDescription = document.querySelector("#algorithm-description");
const algorithmDescriptionTitle = algorithmDescription.querySelector("h2");
const algorithmDescriptionText = algorithmDescription.querySelector("p");
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
const TRANSLATIONS = {
  en: {
    eyebrow: "Task visualization",
    title: "Looped Train",
    description: [
      "Imagine a circular railway. A train runs along it with the last car coupled to the first, so you can freely move between cars from the inside. You find yourself in one random car, and your task is to count the total number of cars. Each car has a light that you can switch on or off, but the initial state of each switch is random and unknown in advance.",
      "All cars look exactly the same on the inside, the windows are covered so you cannot see outside, and the train moves at a constant speed. You cannot mark cars in any way other than switching their lights on or off. The number of cars is finite.",
    ],
    speed: "Speed",
    algoOne: "Simple Algorithm",
    algoTwo: "Bidirectional Algorithm",
    algoThree: "Forward Scan Algorithm",
    descriptions: {
      one: {
        title: "Simple Algorithm",
        text: "Turn on the light in the first car, walk forward counting cars until you reach a car with the light on, turn it off, then walk back to the first car. If the light in the first car is now off, you have counted all the cars. If it is still on, repeat the procedure.",
      },
      two: {
        title: "Bidirectional Algorithm",
        text: "1. Turn on the light in the first car.\n2. Walk forward to the first lit car and turn off its light.\n3. Return to the first car. If its light is off, you have found the count.\n4. If its light is on, walk backward to the first unlit car.\n5. Turn on its light, then walk forward to the car from step\u00a02.\n6. If its light is on, you have counted all the cars.\n7. If it is off, continue forward to the next lit car and turn it off.\n8. Walk back to the car from step\u00a04.\n9. If its light is off, you have counted all the cars. If not, repeat steps 4–9 for the new boundary cars.",
      },
      three: {
        title: "Forward Scan Algorithm",
        text: "1. Turn on the light in the first car. Walk forward counting cars until you reach a lit car.\n2. Turn off its light. Remember the total number of unlit cars passed.\n3. Keep walking while cars are unlit and the count from the current position is less than the number remembered in step\u00a02.\n4. If you reach a lit car, repeat step\u00a02. If the count of unlit cars exceeds the remembered number, walk back to the first car.\n5. If the first car's light is off, you have found the total. If it is on, repeat from step\u00a01.",
      },
    },
    lightOn: "on",
    lightOff: "off",
    summaryCurrentCar: (i, state) => `Current car: ${i} (${state})`,
    summaryVisited: (n, total) => `Visited: ${n}/${total}`,
    summarySteps: (n) => `Steps: ${n}`,
    statusStopped: "Algorithm stopped",
    status: {
      "one.running": "Simple Algorithm: running",
      "two.running": "Bidirectional Algorithm: running",
      "three.running": "Forward Scan Algorithm: running",
      "one.complete": "Simple Algorithm: complete",
      "two.complete": "Bidirectional Algorithm: complete",
      "three.complete": "Forward Scan Algorithm: complete",
    },
    resultLabel: {
      one: "Simple Algorithm answer",
      two: "Bidirectional Algorithm answer",
      three: "Forward Scan Algorithm answer",
    },
    ariaLightsOff: "Turn all lights off",
    ariaLightsOn: "Turn all lights on",
    ariaRandom: "Randomize lights",
    ariaDecrease: "Decrease speed",
    ariaIncrease: "Increase speed",
    ariaStop: "Stop algorithm",
    ariaReset: "Reset to saved state",
    ariaPrev: "Previous car",
    ariaNext: "Next car",
    ariaToggleLight: "Toggle current car light",
    ariaCars: "Number of cars",
    ariaComputing: "Computing",
    ariaCarCount: (n) => `${n} ${n === 1 ? "car" : "cars"} connected in a loop`,
  },
  ru: {
    eyebrow: "Визуализация задачи",
    title: "Зацикленный поезд",
    description: [
      "Представьте себе замкнутую по окружности железную дорогу. По ней едет поезд, последний вагон которого скреплён с первым так, что внутри можно свободно перемещаться между вагонами. Вы оказались в одном случайном вагоне и ваша задача\u00a0— подсчитать их общее количество. В каждом вагоне можно включать или выключать свет, но начальное положение переключателей случайное и заранее неизвестно.",
      "Все вагоны внутри выглядят строго одинаково, окна закрыты так, что невозможно посмотреть наружу, движение поезда равномерное. Помечать вагоны как-либо, кроме включения или выключения света, нельзя. Количество вагонов конечно.",
    ],
    speed: "Скорость",
    algoOne: "Простой алгоритм",
    algoTwo: "Двунаправленный алгоритм",
    algoThree: "Запоминание пути",
    descriptions: {
      one: {
        title: "Простой алгоритм",
        text: "Включаем свет в первом вагоне, идём вперёд считая вагоны до первого вагона с включённым светом, выключаем там свет, возвращаемся в первый вагон. Если в первом вагоне свет выключен - значит мы посчитали все вагоны. Если свет в первом вагоне включён - повторяем процедуру.",
      },
      two: {
        title: "Двунаправленный алгоритм",
        text: "1. Включаем свет в первом вагоне.\n2. Идём вперёд до первого вагона с включённым светом, выключаем там свет.\n3. Возвращаемся в первый вагон. Если свет выключен - мы нашли количество вагонов.\n4. Если свет включён - идём назад до первого вагона с выключённым светом.\n5. Включаем там свет, идём вперёд до вагона из п.\u20092.\n6. Если там свет включён - мы посчитали все вагоны.\n7. Если выключен - идём дальше до первого вагона с включённым светом и выключаем его.\n8. Идём назад до вагона из п.\u20094.\n9. Если там свет выключен - мы посчитали все вагоны. Если нет - повторяем шаги 4–9 для новых крайних вагонов.",
      },
      three: {
        title: "Запоминание пути",
        text: "1. Включаем свет в первом вагоне. Идём вперёд считая вагоны до первого вагона с включённым светом.\n2. Выключаем там свет. Запоминаем общее число пройденных выключенных вагонов.\n3. Идём дальше пока вагоны выключены и их число начиная с текущего меньше запомненного в п.\u20092.\n4. Если попадается включённый вагон - повторяем п.\u20092. Если число выключенных вагонов больше запомненного в п.\u20092 - возвращаемся к первому вагону.\n5. Если первый вагон выключен - мы нашли все вагоны. Если включён - повторяем алгоритм с п.\u20091.",
      },
    },
    lightOn: "вкл",
    lightOff: "выкл",
    summaryCurrentCar: (i, state) => `Текущий вагон: ${i} (${state})`,
    summaryVisited: (n, total) => `Посещено: ${n}/${total}`,
    summarySteps: (n) => `Шаги: ${n}`,
    statusStopped: "Алгоритм остановлен",
    status: {
      "one.running": "Простой алгоритм: выполняется",
      "two.running": "Двунаправленный: выполняется",
      "three.running": "Запоминание пути: выполняется",
      "one.complete": "Простой алгоритм: завершён",
      "two.complete": "Двунаправленный: завершён",
      "three.complete": "Запоминание пути: завершён",
    },
    resultLabel: {
      one: "Ответ (простой)",
      two: "Ответ (двунаправленный)",
      three: "Ответ (прямое сканирование)",
    },
    ariaLightsOff: "Выключить все",
    ariaLightsOn: "Включить все",
    ariaRandom: "Случайные",
    ariaDecrease: "Медленнее",
    ariaIncrease: "Быстрее",
    ariaStop: "Остановить",
    ariaReset: "Сбросить",
    ariaPrev: "Предыдущий вагон",
    ariaNext: "Следующий вагон",
    ariaToggleLight: "Переключить свет",
    ariaCars: "Количество вагонов",
    ariaComputing: "Вычисление",
    ariaCarCount: (n) => `${n} ${n === 1 ? "вагон" : "вагонов"} в кольце`,
  },
};

const currentLangFromSystem = navigator.language.startsWith("ru") ? "ru" : "en";
let currentLang = currentLangFromSystem;

function t() {
  return TRANSLATIONS[currentLang];
}

let lightStates = [];
let visitedCars = [];
let currentCarIndex = 0;
let totalSteps = 0;
let currentCarCount = null;
let algorithmRunning = false;
let algorithmStatus = "";
let algorithmResult = null;
let algorithmResultLabel = "one";
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
  return Math.min(3, 18 / count);
}

function getCarChordLength(count) {
  const segmentAngle = 360 / count;
  const gapAngle = getGapAngle(count);
  const carAngle = ((segmentAngle - gapAngle) * Math.PI) / 180;

  return clamp(2 * RADIUS * Math.sin(carAngle / 2), 14, 320);
}

function createVisitedMarker(cx, cy, rotateDeg, carLength, carHeight) {
  const markerHeight = clamp(carHeight * 0.12, 2, 7);

  return createSvgElement("rect", {
    class: "visited-marker",
    x: -(carLength - 6) / 2,
    y: carHeight / 2 - markerHeight - 2,
    width: carLength - 6,
    height: markerHeight,
    rx: markerHeight / 2,
    transform: `translate(${cx}, ${cy}) rotate(${rotateDeg})`,
  });
}

function createPersonMarker(angle) {
  const position = getPointOnCircle(angle, RADIUS);
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

function showAlgorithmDescription(algorithmKey) {
  const description = t().descriptions[algorithmKey];

  if (!description) {
    return;
  }

  algorithmDescriptionTitle.textContent = description.title;
  algorithmDescriptionText.textContent = description.text;
  algorithmDescription.hidden = false;

  [algorithmOneButton, algorithmTwoButton, algorithmThreeButton].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.algorithm === algorithmKey);
  });
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
  visitedCars[0] = true;
  totalSteps = 0;
  currentCarCount = lightStates.length;
  algorithmStatus = "";
  algorithmResult = null;
  algorithmResultLabel = "one";
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
  algorithmStatus = "stopped";
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
  visitedCars[0] = true;
  totalSteps = 0;
  currentCarCount = lightStates.length;
  algorithmStatus = "";
  algorithmResult = null;
  algorithmResultLabel = "one";
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
  algorithmStatus = "one.running";
  algorithmResult = null;
  algorithmResultLabel = "one";
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
      algorithmStatus = "one.complete";
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
  algorithmStatus = "two.running";
  algorithmResult = null;
  algorithmResultLabel = "two";
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
    algorithmStatus = "two.complete";
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
        algorithmStatus = "two.complete";
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
        algorithmStatus = "two.complete";
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
  algorithmStatus = "three.running";
  algorithmResult = null;
  algorithmResultLabel = "three";
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
        algorithmStatus = "three.complete";
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
    "aria-label": t().ariaCarCount(count),
  });

  carCountInput.value = count;
  syncLightStates(count);
  if (currentCarCount !== count) {
    resetTraversal(count);
  } else {
    syncCurrentCar(count);
  }
  const visitedCount = visitedCars.filter(Boolean).length;
  const tr = t();
  const lightStateText = lightStates[currentCarIndex] ? tr.lightOn : tr.lightOff;
  const statusText = algorithmStatus === "stopped"
    ? tr.statusStopped
    : (algorithmStatus ? tr.status[algorithmStatus] ?? algorithmStatus : "");
  const resultLabelText = tr.resultLabel[algorithmResultLabel] ?? algorithmResultLabel;
  const algorithmResultLine = algorithmResult === null ? "" : `<br>${resultLabelText}: ${algorithmResult}`;
  train.replaceChildren();

  const carLength = getCarChordLength(count);
  const cornerRadius = clamp(carWidth * 0.12, 2, 10);
  const roofInset = carWidth * 0.05;
  const roofHeight = carWidth * 0.9;

  for (let index = 0; index < count; index += 1) {
    const midAngle = -90 + segmentAngle * (index + 0.5);
    const midAngleRad = (midAngle * Math.PI) / 180;
    const cx = CENTER + RADIUS * Math.cos(midAngleRad);
    const cy = CENTER + RADIUS * Math.sin(midAngleRad);
    const rotateDeg = midAngle + 90;
    const carTransform = `translate(${cx}, ${cy}) rotate(${rotateDeg})`;
    const isOn = lightStates[index];

    const car = createSvgElement("rect", {
      class: `car-segment${isOn ? "" : " car-segment--off"}`,
      x: -carLength / 2,
      y: -carWidth / 2,
      width: carLength,
      height: carWidth,
      rx: cornerRadius,
      transform: carTransform,
      "aria-label": `Car ${index + 1}`,
    });

    car.dataset.carIndex = index;
    svg.append(car);

    const roof = createSvgElement("rect", {
      class: "car-roof",
      x: -carLength / 2,
      y: -carWidth / 2 + roofInset,
      width: carLength,
      height: roofHeight,
      rx: cornerRadius,
      transform: carTransform,
      "pointer-events": "none",
    });

    svg.append(roof);

    if (visitedCars[index]) {
      svg.append(createVisitedMarker(cx, cy, rotateDeg, carLength, carWidth));
    }

    if (showLabels) {
      const label = createSvgElement("text", {
        class: `car-label${isOn ? "" : " car-label--off"}`,
        x: cx,
        y: cy,
      });

      label.textContent = index + 1;
      svg.append(label);
    }
  }

  const personAngle = -90 + segmentAngle * (currentCarIndex + 0.5);
  svg.append(createPersonMarker(personAngle));

  train.append(svg);
  currentLightToggleButton.classList.toggle("is-on", lightStates[currentCarIndex]);
  currentLightToggleButton.setAttribute("aria-pressed", String(lightStates[currentCarIndex]));
  summary.innerHTML = `${tr.summaryCurrentCar(currentCarIndex + 1, lightStateText)}<br>${tr.summaryVisited(visitedCount, count)}<br>${tr.summarySteps(totalSteps)}${statusText ? `<br>${statusText}` : ""}${algorithmResultLine}`;
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
  showAlgorithmDescription("one");
  runAlgorithmOne();
});
algorithmTwoButton.addEventListener("click", () => {
  showAlgorithmDescription("two");
  runAlgorithmTwo();
});
algorithmThreeButton.addEventListener("click", () => {
  showAlgorithmDescription("three");
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

function applyTranslations() {
  const tr = t();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = tr[key];

    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      el.innerHTML = value.map((p) => `<p>${p}</p>`).join("");
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;

    if (tr[key] !== undefined) {
      el.setAttribute("aria-label", tr[key]);
    }
  });

  const langToggle = document.querySelector("#lang-toggle");

  if (langToggle) {
    langToggle.textContent = currentLang === "en" ? "RU" : "EN";
  }

  document.documentElement.lang = currentLang;

  if (!algorithmDescription.hidden) {
    const activeButton = document.querySelector(".scene-algorithm-actions button.is-active");

    if (activeButton) {
      showAlgorithmDescription(activeButton.dataset.algorithm);
    }
  }
}

function toggleLang() {
  currentLang = currentLang === "en" ? "ru" : "en";
  applyTranslations();
  renderTrain();
}

document.querySelector("#lang-toggle").addEventListener("click", toggleLang);

updateSpeedIndicator();
setControlsDisabled(false);
applyTranslations();
renderTrain();
setResetSnapshotFromCurrentLights();
