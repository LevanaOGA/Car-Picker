(function () {
  const GRID_SIZE = 14;
  const CELL_COUNT = 21;
  const TICK_MS = 140;
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const OPPOSITES = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  function cloneSegments(segments) {
    return segments.map((segment) => ({ x: segment.x, y: segment.y }));
  }

  function createInitialState(random = Math.random) {
    const snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];

    return {
      snake,
      direction: "right",
      pendingDirection: "right",
      food: placeFood(snake, random),
      score: 0,
      bestScore: loadBestScore(),
      started: false,
      gameOver: false,
      paused: false,
    };
  }

  function loadBestScore() {
    const rawValue = window.localStorage.getItem("snake-best-score");
    const bestScore = Number(rawValue);
    return Number.isFinite(bestScore) ? bestScore : 0;
  }

  function saveBestScore(score) {
    window.localStorage.setItem("snake-best-score", String(score));
  }

  function randomInt(maxExclusive, random = Math.random) {
    return Math.floor(random() * maxExclusive);
  }

  function placeFood(snake, random = Math.random) {
    const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
    const openCells = [];

    for (let y = 0; y < CELL_COUNT; y += 1) {
      for (let x = 0; x < CELL_COUNT; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          openCells.push({ x, y });
        }
      }
    }

    if (openCells.length === 0) {
      return null;
    }

    return openCells[randomInt(openCells.length, random)];
  }

  function queueDirection(state, nextDirection) {
    if (!DIRECTIONS[nextDirection]) {
      return state;
    }

    const currentDirection = state.started ? state.pendingDirection : state.direction;
    if (OPPOSITES[currentDirection] === nextDirection) {
      return state;
    }

    return {
      ...state,
      started: true,
      paused: false,
      pendingDirection: nextDirection,
    };
  }

  function stepState(state) {
    if (state.gameOver || state.paused || !state.started) {
      return state;
    }

    const direction = state.pendingDirection;
    const movement = DIRECTIONS[direction];
    const nextHead = {
      x: state.snake[0].x + movement.x,
      y: state.snake[0].y + movement.y,
    };

    if (
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= CELL_COUNT ||
      nextHead.y >= CELL_COUNT
    ) {
      return { ...state, direction, gameOver: true };
    }

    const nextSnake = [nextHead, ...cloneSegments(state.snake)];
    const isEating = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;

    if (!isEating) {
      nextSnake.pop();
    }

    const body = nextSnake.slice(1);
    const hasSelfCollision = body.some(
      (segment) => segment.x === nextHead.x && segment.y === nextHead.y
    );

    if (hasSelfCollision) {
      return { ...state, direction, gameOver: true };
    }

    const score = isEating ? state.score + 1 : state.score;
    const bestScore = Math.max(state.bestScore, score);
    const nextFood = isEating ? placeFood(nextSnake) : state.food;

    if (bestScore !== state.bestScore) {
      saveBestScore(bestScore);
    }

    return {
      ...state,
      snake: nextSnake,
      direction,
      score,
      bestScore,
      food: nextFood,
      gameOver: nextFood === null,
    };
  }

  function togglePause(state) {
    if (!state.started || state.gameOver) {
      return state;
    }

    return {
      ...state,
      paused: !state.paused,
    };
  }

  function drawGrid(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fffdf9";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#e9e0d2";
    context.lineWidth = 1;
    for (let index = 0; index <= CELL_COUNT; index += 1) {
      const offset = index * GRID_SIZE;
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, canvas.height);
      context.stroke();

      context.beginPath();
      context.moveTo(0, offset);
      context.lineTo(canvas.width, offset);
      context.stroke();
    }
  }

  function drawCell(context, point, color, inset) {
    const size = GRID_SIZE - inset * 2;
    context.fillStyle = color;
    context.fillRect(
      point.x * GRID_SIZE + inset,
      point.y * GRID_SIZE + inset,
      size,
      size
    );
  }

  function render(state, context, canvas, elements) {
    drawGrid(context, canvas);

    if (state.food) {
      drawCell(context, state.food, "#c94c35", 3);
    }

    state.snake.forEach((segment, index) => {
      drawCell(context, segment, index === 0 ? "#285836" : "#3c7a4d", 2);
    });

    elements.score.textContent = String(state.score);
    elements.bestScore.textContent = String(state.bestScore);

    if (state.gameOver) {
      elements.status.textContent = state.food === null
        ? "You filled the board. Restart to play again."
        : "Game over. Restart and try again.";
      return;
    }

    if (state.paused) {
      elements.status.textContent = "Paused. Press Space or Pause to resume.";
      return;
    }

    if (!state.started) {
      elements.status.textContent = "Press any arrow key or WASD to start.";
      return;
    }

    elements.status.textContent = "Use arrow keys, WASD, Space, or the buttons below.";
  }

  const canvas = document.getElementById("game-board");
  const context = canvas.getContext("2d");
  const elements = {
    score: document.getElementById("score"),
    bestScore: document.getElementById("best-score"),
    status: document.getElementById("status"),
    pauseButton: document.getElementById("pause-button"),
    restartButton: document.getElementById("restart-button"),
    controlButtons: Array.from(document.querySelectorAll("[data-direction]")),
  };

  let state = createInitialState();
  let lastTickTime = 0;

  function resetGame() {
    state = createInitialState();
    lastTickTime = 0;
    elements.pauseButton.textContent = "Pause";
    render(state, context, canvas, elements);
  }

  function handleDirectionInput(direction) {
    state = queueDirection(state, direction);
    elements.pauseButton.textContent = state.paused ? "Resume" : "Pause";
    render(state, context, canvas, elements);
  }

  function handlePauseToggle() {
    state = togglePause(state);
    elements.pauseButton.textContent = state.paused ? "Resume" : "Pause";
    render(state, context, canvas, elements);
  }

  function onKeyDown(event) {
    const keyMap = {
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
    };

    const direction = keyMap[event.key];
    if (event.key === " ") {
      event.preventDefault();
      handlePauseToggle();
      return;
    }

    if (!direction) {
      return;
    }

    event.preventDefault();

    if (state.gameOver) {
      resetGame();
    }

    handleDirectionInput(direction);
  }

  function tick(timestamp) {
    if (!lastTickTime) {
      lastTickTime = timestamp;
    }

    if (timestamp - lastTickTime >= TICK_MS) {
      state = stepState(state);
      render(state, context, canvas, elements);
      lastTickTime = timestamp;
    }

    window.requestAnimationFrame(tick);
  }

  document.addEventListener("keydown", onKeyDown);
  elements.pauseButton.addEventListener("click", handlePauseToggle);
  elements.restartButton.addEventListener("click", resetGame);
  elements.controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.gameOver) {
        resetGame();
      }

      handleDirectionInput(button.dataset.direction);
    });
  });

  render(state, context, canvas, elements);
  window.SnakeGame = {
    CELL_COUNT,
    DIRECTIONS,
    OPPOSITES,
    createInitialState,
    placeFood,
    queueDirection,
    stepState,
    togglePause,
  };
  window.requestAnimationFrame(tick);
})();
