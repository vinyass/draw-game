let canvas,
  ctx,
  drawing = false,
  timerExpired = false,
  color = "#000000",
  thickness = 5,
  currentPlayer,
  correctGuesses,
  wordsToBeGuessed;

const socket = io("https://guarded-woodland-49277.herokuapp.com/");

socket.on("init", initGame);
socket.on("unknownCode", () => throwError("unknown code entered"));
socket.on("tooManyPlayers", () => throwError("already full"));
socket.on("gameCode", renderGameCode);
socket.on("startGame", startGame);
socket.on("paintStart", paintStart);
socket.on("paint", paint);
socket.on("paintStop", paintStop);
socket.on("clearDrawing", clearDrawing);
socket.on("renderGuessedWord", renderGuessedWord);

const clearButton = document.getElementById("clearBtn");
const colorPicker = document.getElementById("colorPicker");
const thicknessSlider = document.getElementById("thickness");
const gameCodeInput = document.getElementById("gameCode");
const newGameBtn = document.getElementById("newGameBtn");
const joinGameBtn = document.getElementById("joinGameBtn");
const submitBtn = document.getElementById("submitBtn");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);
submitBtn.addEventListener("click", submitGuess);

clearButton.addEventListener("click", clearCanvas);
thicknessSlider.addEventListener("change", changeThickness);
thicknessSlider.value = thickness;
colorPicker.value = color;
colorPicker.addEventListener("input", changeColor);

function throwError(error) {
  const container = document.querySelector(".container");
  const homeScreen = document.querySelector(".home_screen");
  homeScreen.style.display = "flex";
  container.style.display = "none";

  alert(error);
}
function newGame() {
  socket.emit("newGame");
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit("joinGame", code);
  init();
}

function submitGuess() {
  const guessedWord = document.getElementById("guessedWord").value;
  socket.emit("guessedWord", guessedWord);
  renderGuessWordForm(guessedWord);
}

function renderGuessedWord(guessedWord) {
  const guessedWordsListElem = document.querySelector(".guesses");
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.innerText = guessedWord;
  span.setAttribute("id", guessedWord);
  span.classList.add("guessed-word");
  if (wordsToBeGuessed.includes(guessedWord.toLowerCase())) {
    span.classList.add("correct-guess");
    correctGuesses.push(guessedWord.toLowerCase());
  } else {
    span.classList.add("incorrect-guess");
  }
  li.appendChild(span);
  guessedWordsListElem.appendChild(li);

  if (currentPlayer === 1) {
    const wordsListElem = document.querySelector(".guess-words");
    const matchedWord = wordsListElem.querySelector(`#${guessedWord}`);
    if (matchedWord) {
      matchedWord.style.textDecoration = "line-through";
    }
  }
}

function renderGameCode(gameCode) {
  const gameCodeElem = document.querySelector(".game-code");
  gameCodeElem.innerText = `Your game code is: ${gameCode}`;
}

function startGame(data) {
  data = JSON.parse(data);
  wordsToBeGuessed = data.words;
  correctGuesses = [];
  const spinner = document.querySelector(".spinner");
  const gameContainer = document.querySelector(".game-container");
  spinner.style.display = "none";
  gameContainer.style.display = "flex";
  if (currentPlayer === 1) {
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchmove", handleMouseUp);
    canvas.addEventListener("touchend", handleMouseMove);
    renderWords(wordsToBeGuessed);
  }
  if (currentPlayer === 2) {
    renderGuessWordForm();
  }
  startTimer(30);
}

function renderWords(words) {
  const wordsListElem = document.querySelector(".guess-words");
  words.forEach((word) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.innerText = word;
    span.setAttribute("id", word);
    span.classList.add("guess-word");
    li.appendChild(span);
    wordsListElem.appendChild(li);
  });
}

function renderGuessWordForm() {
  const guessedWordForm = document.getElementById("guessedWordForm");
  guessedWordForm.style.display = "block";
}

function init() {
  const container = document.querySelector(".container");
  const homeScreen = document.querySelector(".home_screen");
  const spinner = document.querySelector(".spinner");
  homeScreen.style.display = "none";
  container.style.display = "flex";
  spinner.style.display = "flex";
  canvas = document.getElementById("canvas");
  const parent = document.querySelector(".canvas-container");
  //canvas.width = parent.offsetWidth;
  //canvas.height = parent.offsetHeight;

  ctx = canvas.getContext("2d");
}

function initGame(player) {
  currentPlayer = player;
}

function getPosition(e) {
  var position = {
    x: e.targetTouches ? e.targetTouches[0].pageX : e.clientX,
    y: e.targetTouches ? e.targetTouches[0].pageY : e.clientY,
  };
  var bcr = e.target.getBoundingClientRect();
  var x = position.x - bcr.x;
  var y = position.y - bcr.y;
  return { x, y };
}

function handleMouseDown(e) {
  drawing = !timerExpired;
  if (drawing) {
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    const { x, y } = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    socket.emit("drawStart", JSON.stringify({ x, y, thickness, color }));
  }
}

function paintStart(data) {
  if (currentPlayer === 2) {
    const { x, y, thickness, color } = JSON.parse(data);
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
}

function handleMouseMove(e) {
  if (!drawing) return;

  const { x, y } = getPosition(e);
  ctx.lineTo(x, y);
  ctx.stroke();
  drawing = !timerExpired;
  socket.emit("draw", JSON.stringify({ x, y }));
}

function paint(data) {
  if (currentPlayer === 2) {
    const { x, y } = JSON.parse(data);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function handleMouseUp(e) {
  if (drawing) {
    ctx.closePath();
    drawing = false;
    socket.emit("drawStop");
  }
}

function paintStop() {
  if (currentPlayer === 2) {
    ctx.closePath();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clearDrawing");
}

function clearDrawing() {
  if (currentPlayer === 2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function changeColor(e) {
  color = e.target.value;
}

function changeThickness(e) {
  thickness = e.target.value;
}

function startTimer(duration = 30) {
  let timer = duration,
    display = document.getElementById("safeTimerDisplay"),
    minutes,
    seconds;
  const interval = setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      timer = 0;
      timerExpired = true;
      clearInterval(interval);
      afterTimerExpired();
    }
  }, 1000);
}

function afterTimerExpired() {
  countPoints();
  document.getElementById("guessedWordForm").style.display = "none";
}

function countPoints() {
  let score = 0;
  if (currentPlayer === 1) {
    score += correctGuesses.length * 2;
  } else {
    score += correctGuesses.length;
  }
  document.querySelector(".score-container").style.display = "block";
  document.getElementById("scoreDisplay").textContent = score;
}
