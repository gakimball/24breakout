/**
 * @typedef {object} Entity
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {number} color
 * @property {Vector} vector
 */

/**
 * @typedef {object} Vector
 * @property {number} x
 * @property {number} y
 */

const SCREEN_SIZE = 24
const BLOCK_COLORS = Object.values(Color).filter(color => ![Color.Black, Color.Gray].includes(color))

/** @type {Entity} */
const paddle = {
  x: SCREEN_SIZE / 2,
  y: SCREEN_SIZE - 2,
  w: 6,
  h: 1,
  color: Color.Blue,
  vector: { x: 0, y: -1 },
}

/** @type {Entity[]} */
const walls = [
  {
    x: 0,
    y: 0,
    w: SCREEN_SIZE,
    h: 1,
    color: Color.Black,
    vector: { x: 0, y: 1 },
  },
  {
    x: 0,
    y: 1,
    w: 1,
    h: SCREEN_SIZE - 1,
    color: Color.Black,
    vector: { x: 1, y: 0 },
  },
  {
    x: SCREEN_SIZE - 1,
    y: 1,
    w: 1,
    h: SCREEN_SIZE - 1,
    color: Color.Black,
    vector: { x: -1, y: 0 },
  },
]

/** @type {Entity} */
const ball = {
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  color: Color.Black,
  vector: { x: 1, y: -1 },
}

/** @type {Entity} */
const gutter = {
  x: 1,
  y: SCREEN_SIZE - 1,
  w: SCREEN_SIZE - 2,
  h: 1,
  color: Color.Gray,
  vector: { x: 0, y: -1 },
}

/** @type {Entity[]} */
const blocks = Array.from({ length: 16 }, (_, index) => {
  const w = 5
  const h = 1

  return {
    x: 2 + (w * (index % 4)),
    y: 2 + Math.floor(index / 4),
    w,
    h,
    color: BLOCK_COLORS[index % BLOCK_COLORS.length],
    vector: { x: 0, y: 0 },
  }
})

const entitites = [
  paddle,
  ball,
  gutter,
  ...walls,
  ...blocks,
]

const gameState = {
  lives: 3,
  ballCountdown: 24,
  get shouldBallMove() {
    return this.lives > 0 && this.ballCountdown === 0 && !this.isWinner
  },
  get isWinner() {
    return !entitites.some(entity => blocks.includes(entity))
  },
  get statusText() {
    if (this.isWinner) {
      return 'You\'re Winner'
    }

    if (this.lives === 0) {
      return 'Your James Over'
    }

    return `Lives: ${this.lives}`
  },
  tick() {
    this.ballCountdown = Math.max(this.ballCountdown - 1, 0)
    this.moveBallThisFrame = !this.moveBallThisFrame
  },
  handleGutterBall() {
    this.lives -= 1
    this.ballCountdown = 36
    resetBall()
  },
}

/** @param {Entity} entity */
function draw_entity(game, entity) {
  for (let x = 0; x < entity.w; x++) {
    for (let y = 0; y < entity.h; y++) {
      game.setDot(entity.x + x, entity.y + y, entity.color)
    }
  }
}

function entities_collide(/** @type {Entity} */ a, /** @type {Entity} */ b) {
  return !(
    b.x >= a.x + a.w
    || b.x + b.w <= a.x
    || b.y >= a.y + a.h
    || b.y + b.h <= a.y
  )
}

function vector_dot_product(/** @type {Vector} */ a, /** @type {Vector} */ b) {
  return (a.x * b.x) + (a.y * b.y)
}

/** @returns {Vector} */
function vector_add(/** @type {Vector} */ vector, /** @type {Vector | number} */ value) {
  return {
    x: vector.x + (typeof value === 'number' ? value : value.x),
    y: vector.y + (typeof value === 'number' ? value : value.y),
  }
}

/** @returns {Vector} */
function vector_subtract(/** @type {Vector} */ vector, /** @type {Vector | number} */ value) {
  return {
    x: vector.x - (typeof value === 'number' ? value : value.x),
    y: vector.y - (typeof value === 'number' ? value : value.y),
  }
}

/** @returns {Vector} */
function vector_scale(/** @type {Vector} */ vector, /** @type {number} */ value) {
  return {
    x: vector.x * value,
    y: vector.y * value,
  }
}

function bounce_vector(/** @type {Vector} */ incident, /** @type {Vector} */ normal) {
  return vector_subtract(
    incident,
    vector_scale(
      normal,
      2 * vector_dot_product(incident, normal),
    ),
  )
}

function move_ball() {
  const nextX = ball.x + ball.vector.x
  const nextY = ball.y + ball.vector.y
  const collidingEntity = entitites.find(entity => (
    entity !== ball
    && entities_collide({ ...ball, x: nextX, y: nextY }, entity)
  ))

  if (collidingEntity === gutter) {
    gameState.handleGutterBall()
  } else if (blocks.includes(collidingEntity)) {
    ball.vector = bounce_vector(ball.vector, {
      x: 0,
      y: ball.y < collidingEntity.y ? -1 : 1,
    })
    entitites.splice(entitites.indexOf(collidingEntity), 1)
    move_ball()
  } else if (collidingEntity) {
    ball.vector = bounce_vector(ball.vector, collidingEntity.vector)
    move_ball()
  } else {
    ball.x = nextX
    ball.y = nextY
  }
}

function resetBall() {
  ball.x = 12
  ball.y = 7
  ball.vector = {
    x: Math.random() > 0.5 ? 1 : -1,
    y: 1,
  }
}

function create() {
  resetBall()
}

function update(game) {
  gameState.tick()

  if (gameState.shouldBallMove) {
    move_ball()
  }

  if (gameState.isWinner) {
    ball.color = Color.Gray
  }

  entitites.forEach(entity => draw_entity(game, entity))
  game.setText(gameState.statusText)
}

function onKeyPress(direction) {
  let nextX = paddle.x

  switch (direction) {
    case Direction.Left:
      nextX -= 1
      break
    case Direction.Right:
      nextX += 1
      break
    default:
      return
  }

  const nextRect = {
    ...paddle,
    x: nextX,
  }

  if (!walls.some(wall => entities_collide(nextRect, wall))) {
    paddle.x = nextX
  }
}

const game = new Game({
  create,
  update,
  onKeyPress,
  frameRate: 12,
  containerId: 'game',
})

game.run()
