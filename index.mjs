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
const MAX_SPEED = 20; // 最大速度常量

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
    speed: 3, // 速度绝对值
    angle: Math.PI / 4, // 角度 (向右下移动)
    reverseColor: WEI_COLOR,
    ballColor: WEI_BALL_COLOR,
  },
  {
    x: canvas.width / 4, // 蜀国球位置 - center of bottom left quarter
    y: (canvas.height / 4) * 3, // Center of bottom half
    speed: 3, // 速度绝对值
    angle: -Math.PI / 4, // 角度 (向右上移动)
    reverseColor: SHU_COLOR,
    ballColor: SHU_BALL_COLOR,
  },
  {
    // 吴国球
    x: (canvas.width / 4) * 3, // 吴国球位置 - center of bottom right quarter
    y: (canvas.height / 4) * 3, // Center of bottom half
    speed: 3, // 速度绝对值
    angle: (Math.PI * 5) / 4, // 角度 (向左上移动)
    reverseColor: WU_COLOR,
    ballColor: WU_BALL_COLOR,
  },
];

let iteration = 0;
// 贝塞尔曲线函数，用于计算速度比例
function bezierSpeedCurve(t) {
  // Using cubic-bezier(.11, .46, .5, -0.14)
  return (
    Math.pow(1 - t, 3) * 0 +
    3 * Math.pow(1 - t, 2) * t * 0.11 +
    3 * (1 - t) * Math.pow(t, 2) * 0.5 +
    Math.pow(t, 3) * 1 +
    3 * Math.pow(1 - t, 2) * t * 0.46 +
    3 * (1 - t) * Math.pow(t, 2) * -0.14
  );
}

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
          // 水平碰撞，反转角度的水平分量
          ball.angle = Math.PI - ball.angle;
        } else {
          // 垂直碰撞，反转角度的垂直分量
          ball.angle = -ball.angle;
        }

        // 标准化角度到 [0, 2π) 范围
        ball.angle =
          ((ball.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      }
    }
  }
}

function checkBoundaryCollision(ball) {
  // 计算当前的dx和dy用于边界检测
  const dx = Math.cos(ball.angle) * ball.speed;
  const dy = Math.sin(ball.angle) * ball.speed;

  if (
    ball.x + dx > canvas.width - SQUARE_SIZE / 2 ||
    ball.x + dx < SQUARE_SIZE / 2
  ) {
    // 水平边界碰撞，反转角度的水平分量
    ball.angle = Math.PI - ball.angle;
  }
  if (
    ball.y + dy > canvas.height - SQUARE_SIZE / 2 ||
    ball.y + dy < SQUARE_SIZE / 2
  ) {
    // 垂直边界碰撞，反转角度的垂直分量
    ball.angle = -ball.angle;
  }

  // 标准化角度到 [0, 2π) 范围
  ball.angle = ((ball.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function updateBallSpeed(ball) {
  // 计算当前球对应颜色的格子数量
  let territoryCount = 0;
  if (ball.reverseColor === WEI_COLOR) {
    territoryCount = weiScore;
  } else if (ball.reverseColor === SHU_COLOR) {
    territoryCount = shuScore;
  } else if (ball.reverseColor === WU_COLOR) {
    territoryCount = wuScore;
  }

  // 计算总格子数
  const totalSquares = numSquaresX * numSquaresY;

  // 计算领地比例 (0-1)
  const territoryRatio = territoryCount / totalSquares;

  // 使用贝塞尔曲线计算速度比例
  const speedRatio = bezierSpeedCurve(territoryRatio);

  // 计算最终速度: 最大速度 * 速度比例
  ball.speed = MAX_SPEED * speedRatio;

  // 扰动强度基于领地比例：领地越少，扰动越大
  // 当领地比例为0时，扰动强度为0.05
  // 当领地比例为1时，扰动强度为0.005
  const perturbationStrength = 0.05 * (1 - territoryRatio) + 0.005;

  // 添加基于领地比例的随机性扰动
  ball.angle += perturbationStrength * (1 - 2 * Math.random());

  // 标准化角度到 [0, 2π) 范围
  ball.angle = ((ball.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
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

    // 根据速度和角度计算位移
    ball.x += Math.cos(ball.angle) * ball.speed;
    ball.y += Math.sin(ball.angle) * ball.speed;

    updateBallSpeed(ball);
  });

  iteration++;
  if (iteration % 1_000 === 0) {
    console.log("iteration", iteration);
    console.log("territories:", { wei: weiScore, shu: shuScore, wu: wuScore });
    console.log(
      "speeds:",
      balls.map((ball) => {
        const territoryCount =
          ball.reverseColor === WEI_COLOR
            ? weiScore
            : ball.reverseColor === SHU_COLOR
            ? shuScore
            : wuScore;
        const ratio = territoryCount / (numSquaresX * numSquaresY);
        const perturbation = 0.05 * (1 - ratio) + 0.005;
        return {
          color: ball.reverseColor,
          speed: ball.speed.toFixed(2),
          ratio: ratio.toFixed(3),
          perturbation: perturbation.toFixed(4),
        };
      })
    );
  }
}

const FRAME_RATE = 100;
drawSquares();
balls.forEach((ball) => {
  drawBall(ball);
});
updateScoreDisplay(); // Initialize button scores

setTimeout(() => {
  setInterval(draw, 1000 / FRAME_RATE);
}, 1000);
