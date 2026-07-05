/* ============================================================
   PHASER NEON BREAKOUT — a full game loop, zero image assets
   Textures are baked from Graphics at boot; arcade physics
   drives the ball; paddle position controls the exit angle.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const W = 800;
const H = 600;
const BRICK_COLORS = [0xff2ea6, 0xff5c77, 0xffb454, 0xffe066, 0x66e0ff];
const MAX_SPEED = 640;

let paddle;
let ball;
let bricks;
let cursors;
let scoreText;
let livesText;
let statusText;
let score;
let lives;
let launched;
let gameOver;

function makeTextures(scene) {
  let g = scene.add.graphics();
  g.fillStyle(0x66e0ff, 1);
  g.fillRoundedRect(0, 0, 110, 18, 9);
  g.generateTexture("paddle", 110, 18);
  g.destroy();

  g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture("ball", 16, 16);
  g.destroy();

  BRICK_COLORS.forEach((color, i) => {
    const gg = scene.add.graphics();
    gg.fillStyle(color, 1);
    gg.fillRoundedRect(0, 0, 64, 22, 6);
    gg.generateTexture(`brick${i}`, 64, 22);
    gg.destroy();
  });
}

function create() {
  score = 0;
  lives = 3;
  launched = false;
  gameOver = false;

  makeTextures(this);

  // three walls; the floor is open — falling out costs a life
  this.physics.world.setBoundsCollision(true, true, true, false);

  bricks = this.physics.add.staticGroup();
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      bricks.create(85 + col * 70, 92 + row * 32, `brick${row}`);
    }
  }

  paddle = this.physics.add.image(W / 2, 556, "paddle").setImmovable(true);
  paddle.body.allowGravity = false;

  ball = this.physics.add.image(W / 2, 538, "ball").setCollideWorldBounds(true).setBounce(1);

  // glow FX exists only on the WebGL renderer — decorative, so best-effort
  try {
    ball.postFX.addGlow(0xffffff, 3);
    paddle.postFX.addGlow(0x66e0ff, 3);
  } catch {
    /* canvas renderer: play without glow */
  }

  this.physics.add.collider(ball, paddle, hitPaddle, null, this);
  this.physics.add.collider(ball, bricks, hitBrick, null, this);

  const hud = { fontFamily: '"Press Start 2P", monospace', fontSize: "13px" };
  scoreText = this.add.text(16, 14, "SCORE 0", { ...hud, color: "#66e0ff" });
  livesText = this.add.text(W - 16, 14, "LIVES 3", { ...hud, color: "#ff2ea6" }).setOrigin(1, 0);
  statusText = this.add
    .text(W / 2, 356, "CLICK TO LAUNCH", { ...hud, fontSize: "16px", color: "#ecebf5" })
    .setOrigin(0.5);

  this.input.on("pointermove", (pointer) => {
    if (gameOver) return;
    paddle.x = Phaser.Math.Clamp(pointer.x, 55, W - 55);
  });

  this.input.on("pointerdown", () => {
    if (gameOver) {
      this.scene.restart();
    } else {
      launch();
    }
  });

  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on("keydown-SPACE", () => {
    if (gameOver) {
      this.scene.restart();
    } else {
      launch();
    }
  });
}

function launch() {
  if (launched || gameOver) return;
  launched = true;
  statusText.setVisible(false);
  ball.setVelocity(Phaser.Math.Between(-120, 120), -400);
}

function hitPaddle(ballObj, paddleObj) {
  // exit angle depends on where the ball strikes the paddle
  const offset = ballObj.x - paddleObj.x;
  ballObj.setVelocityX(offset * 7);
}

function hitBrick(ballObj, brick) {
  brick.disableBody(true, true);
  score += 10;
  scoreText.setText(`SCORE ${score}`);

  // escalate: nudge speed toward the cap
  const v = ballObj.body.velocity;
  const speed = Math.hypot(v.x, v.y);
  const next = Math.min(speed * 1.02, MAX_SPEED);
  ballObj.body.velocity.scale(next / speed);

  if (!prefersReduced) this.cameras.main.shake(50, 0.0018);

  if (bricks.countActive() === 0) {
    gameOver = true;
    ball.setVelocity(0, 0);
    statusText.setText("YOU WIN! CLICK TO RESTART").setVisible(true);
  }
}

function loseLife(scene) {
  lives--;
  livesText.setText(`LIVES ${lives}`);
  if (!prefersReduced) scene.cameras.main.shake(160, 0.006);

  if (lives <= 0) {
    gameOver = true;
    ball.setVelocity(0, 0);
    ball.setVisible(false);
    statusText.setText("GAME OVER - CLICK TO RESTART").setVisible(true);
  } else {
    launched = false;
    ball.setVelocity(0, 0);
    ball.setPosition(paddle.x, 538);
    statusText.setText("CLICK TO LAUNCH").setVisible(true);
  }
}

function update() {
  if (gameOver) return;

  if (cursors.left.isDown) paddle.x = Phaser.Math.Clamp(paddle.x - 9, 55, W - 55);
  if (cursors.right.isDown) paddle.x = Phaser.Math.Clamp(paddle.x + 9, 55, W - 55);

  if (!launched) ball.x = paddle.x;

  if (launched && ball.y > H + 20) loseLife(this);
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#07040f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  physics: { default: "arcade" },
  scene: { create, update },
});
