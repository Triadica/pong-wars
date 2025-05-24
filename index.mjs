// Source palette: https://twitter.com/AlexCristache/status/1738610343499157872
// Idea for Pong wars: https://twitter.com/nicolasdnl/status/1749715070928433161

const colorPalette = {
  ArcticPowder: "#F1F6F4",
  MysticMint: "#D9E8E3",
  Forsythia: "#FFC801",
  DeepSaffron: "#FF9932",
  NocturnalExpedition: "#114C5A",
  OceanicNoir: "#172B36",
};

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const weiScoreElement = document.getElementById("weiScore");
const shuScoreElement = document.getElementById("shuScore");
const wuScoreElement = document.getElementById("wuScore");

const WEI_COLOR = "#8899DD"; // 魏国 - Blue background (relaxed tone)
const WEI_BALL_COLOR = "#6677CC"; // 魏国 - Blue ball (relaxed tone)
const SHU_COLOR = "#DD8888"; // 蜀国 - Red background (relaxed tone)
const SHU_BALL_COLOR = "#CC6666"; // 蜀国 - Red ball (relaxed tone)
const WU_COLOR = "#88DD88"; // 吴国 - Green background (relaxed tone)
const WU_BALL_COLOR = "#66CC66"; // 吴国 - Green ball (relaxed tone)
const SQUARE_SIZE = 16;
const MIN_SPEED = 5;
const MAX_SPEED = 10;

const numSquaresX = canvas.width / SQUARE_SIZE;
const numSquaresY = canvas.height / SQUARE_SIZE;

let weiScore = 0;
let shuScore = 0;
let wuScore = 0;

const squares = [];

// Populate the fields, 魏蜀吴 three kingdoms
// Wei: top half, Shu: bottom left quarter, Wu: bottom right quarter
for (let i = 0; i < numSquaresX; i++) {
  squares[i] = [];
  for (let j = 0; j < numSquaresY; j++) {
    if (j < numSquaresY / 2) {
      // Top half - Wei (魏国)
      squares[i][j] = WEI_COLOR;
    } else if (i < numSquaresX / 2) {
      // Bottom left quarter - Shu (蜀国)
      squares[i][j] = SHU_COLOR;
    } else {
      // Bottom right quarter - Wu (吴国)
      squares[i][j] = WU_COLOR;
    }
  }
}

const balls = [
  {
    x: canvas.width / 2, // 魏国球位置 - center of top area
    y: canvas.height / 4, // Center of top half
    dx: 8,
    dy: 8, // Moving downward initially
    reverseColor: WEI_COLOR,
    ballColor: WEI_BALL_COLOR,
  },
  {
    x: canvas.width / 4, // 蜀国球位置 - center of bottom left quarter
    y: (canvas.height / 4) * 3, // Center of bottom half
    dx: 8,
    dy: -8,
    reverseColor: SHU_COLOR,
    ballColor: SHU_BALL_COLOR,
  },
  {
    // 吴国球
    x: (canvas.width / 4) * 3, // 吴国球位置 - center of bottom right quarter
    y: (canvas.height / 4) * 3, // Center of bottom half
    dx: -5, // Different initial speed for variety
    dy: -5,
    reverseColor: WU_COLOR,
    ballColor: WU_BALL_COLOR,
  },
];

let iteration = 0;

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, SQUARE_SIZE / 2, 0, Math.PI * 2, false);
  ctx.fillStyle = ball.ballColor;
  ctx.fill();

  // Add white border
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.closePath();
}

function drawSquares() {
  weiScore = 0;
  shuScore = 0;
  wuScore = 0; // Reset 吴国 score

  for (let i = 0; i < numSquaresX; i++) {
    for (let j = 0; j < numSquaresY; j++) {
      ctx.fillStyle = squares[i][j];
      ctx.fillRect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

      // Update scores
      if (squares[i][j] === WEI_COLOR) weiScore++;
      if (squares[i][j] === SHU_COLOR) shuScore++;
      if (squares[i][j] === WU_COLOR) wuScore++; // Update 吴国 score
    }
  }
}

function checkSquareCollision(ball) {
  // Check multiple points around the ball's circumference
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    const checkX = ball.x + Math.cos(angle) * (SQUARE_SIZE / 2);
    const checkY = ball.y + Math.sin(angle) * (SQUARE_SIZE / 2);

    const i = Math.floor(checkX / SQUARE_SIZE);
    const j = Math.floor(checkY / SQUARE_SIZE);

    if (i >= 0 && i < numSquaresX && j >= 0 && j < numSquaresY) {
      if (squares[i][j] !== ball.reverseColor) {
        // Square hit! Update square color
        squares[i][j] = ball.reverseColor;

        // Determine bounce direction based on the angle
        if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }
      }
    }
  }
}

function checkBoundaryCollision(ball) {
  if (
    ball.x + ball.dx > canvas.width - SQUARE_SIZE / 2 ||
    ball.x + ball.dx < SQUARE_SIZE / 2
  ) {
    ball.dx = -ball.dx;
  }
  if (
    ball.y + ball.dy > canvas.height - SQUARE_SIZE / 2 ||
    ball.y + ball.dy < SQUARE_SIZE / 2
  ) {
    ball.dy = -ball.dy;
  }
}

function addRandomness(ball) {
  ball.dx += Math.random() * 0.02 - 0.01;
  ball.dy += Math.random() * 0.02 - 0.01;

  // Limit the speed of the ball
  ball.dx = Math.min(Math.max(ball.dx, -MAX_SPEED), MAX_SPEED);
  ball.dy = Math.min(Math.max(ball.dy, -MAX_SPEED), MAX_SPEED);

  // Make sure the ball always maintains a minimum speed
  if (Math.abs(ball.dx) < MIN_SPEED)
    ball.dx = ball.dx > 0 ? MIN_SPEED : -MIN_SPEED;
  if (Math.abs(ball.dy) < MIN_SPEED)
    ball.dy = ball.dy > 0 ? MIN_SPEED : -MIN_SPEED;
}

function updateScoreDisplay() {
  weiScoreElement.textContent = weiScore;
  shuScoreElement.textContent = shuScore;
  wuScoreElement.textContent = wuScore;

  // Update bar widths
  const totalSquares = numSquaresX * numSquaresY;
  const weiPercentage = (weiScore / totalSquares) * 100;
  const shuPercentage = (shuScore / totalSquares) * 100;
  const wuPercentage = (wuScore / totalSquares) * 100;

  document.getElementById("weiBar").style.width = weiPercentage + "%";
  document.getElementById("shuBar").style.width = shuPercentage + "%";
  document.getElementById("wuBar").style.width = wuPercentage + "%";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSquares();

  updateScoreDisplay();

  balls.forEach((ball) => {
    checkSquareCollision(ball);
    checkBoundaryCollision(ball);
    drawBall(ball);
    ball.x += ball.dx;
    ball.y += ball.dy;

    addRandomness(ball);
  });

  iteration++;
  if (iteration % 1_000 === 0) console.log("iteration", iteration);
}

const FRAME_RATE = 100;
drawSquares();
balls.forEach((ball) => {
  drawBall(ball);
});
updateScoreDisplay(); // Initialize button scores

setTimeout(() => {
  setInterval(draw, 1000 / FRAME_RATE);
}, 4000);
