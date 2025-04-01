const player = { x: 14, y: 23, w: 6, h: 1, color: Color.Violet }
const ball = { x: 12, y: 10, w: 1, h: 1, color: Color.Red, dx: 1, dy: 1 }
const blocks = []
const walls = [
	{ x: 0, y: 0, w: 1, h: 24, color: Color.Black },
	{ x: 23, y: 0, w: 1, h: 24, color: Color.Black },
	{ x: 1, y: 0, w: 22, h: 1, color: Color.Black },
]
const gutter = { x: 1, y: 24, w: 22, h: 1 }

const overlaps = (r1, r2) => !(
  r2.x >= r1.x + r1.w
  || r2.x + r2.w <= r1.x
  || r2.y >= r1.y + r1.h
  || r2.y + r2.h <= r1.y
)

const occupiesSpace = (entity, point) => {
	for (let x = entity.x; x < (entity.x + entity.w); x++) {
		for (let y = entity.y; y < (entity.y + entity.h); y++) {
			if (x === point.x && y === point.y) {
				return true
			}
		}
	}

	return false
}

Array.from({ length: 11 }, (_, x) => {
	Array.from({ length: 4 }, (_, y) => {
		blocks.push({
			x: x * 2 + 1,
			w: 2,
			y: y * 1 + 1,
			h: 1,
			color: (x + y) % 2 === 0 ? Color.Green : Color.Blue,
		})
	})
})

const entities = [
	gutter,
	...walls,
	...blocks,
	player,
	ball,
]
let pendingRemoval = []

const moveBall = () => {
	const nextX = ball.x + ball.dx
	const nextY = ball.y + ball.dy
	
	const collidesXY = entities.find(e => occupiesSpace(e, { x: nextX, y: nextY }))

	if (collidesXY === gutter) {
		// game.end()
	} else if (blocks.includes(collidesXY)) {
		pendingRemoval.push(collidesXY)
	}

	if (!collidesXY) {
		ball.x = nextX
		ball.y = nextY
	} else {
		const collidesX = entities.find(e => occupiesSpace(e, { x: nextX, y: ball.y }))
		const collidesY = entities.find(e => occupiesSpace(e, { x: ball.x, y: nextY }))

		if (collidesX) {
			if (collidesY) {
				// Flip x/y
				ball.dx = -ball.dx
				ball.dy = -ball.dy
			} else {
				// Flip x
				ball.dx = -ball.dx
			}
		} else if (collidesY) {
			// Flip y
			ball.dy = -ball.dy
		} else {
			// Flip x/y
			ball.dx = -ball.dx
			ball.dy = -ball.dy
		}

		moveBall()
	}
}

const create = (game) => {

}

const update = (game) => {
	pendingRemoval = []
	moveBall()
	pendingRemoval.forEach(entity => {
		blocks.splice(blocks.indexOf(entity), 1)
		entities.splice(entities.indexOf(entity), 1)
	})

	// Render everything
	entities.forEach(entity => {
		if (!entity.color) {
			return
		}

		Array.from({ length: entity.w }, (_, x) => {
			Array.from({ length: entity.h }, (_, y) => {
				game.setDot(entity.x + x, entity.y + y, entity.color)
			})
		})
	})
}

const onKeyPress = (direction) => {
	switch (direction) {
		case Direction.Left:
			if (player.x > 0) {
				player.x--
			}
			break
		case Direction.Right:
			if (player.x + player.w < 24) {
				player.x++
			}
			break
	}
}

const game = new Game({ create, update, onKeyPress, frameRate: 24 })

game.run()
