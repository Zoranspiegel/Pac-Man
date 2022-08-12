///SETUP///////////////////////////////////////////////////////////////////
const scoreHTML = window.document.querySelector("#score");
const canvas = window.document.querySelector("canvas");
const c2d = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 600;
///VARIABLES///////////////////////////////////////////////////////////////
const TILE_SIZE = 40;
const MOV_SPEED = 4;
const GHOST_SPEED = MOV_SPEED / 2;
const keys = {
  up: { pressed: false },
  down: { pressed: false },
  left: { pressed: false },
  right: { pressed: false },
};
let lastKey = "";
let score = 0;
let animationFrameId;
///CLASSES/////////////////////////////////////////////////////////////////
class PacMan {
  constructor({ position, movement }) {
    this.position = position;
    this.movement = movement;
    this.radius = 15;
    this.radians = 0.75;
    this.chompRate = 0.1;
    this.rotation = 0;
  }
  draw() {
    c2d.save();
    c2d.translate(this.position.x, this.position.y);
    c2d.rotate(this.rotation);
    c2d.translate(-this.position.x, -this.position.y);
    c2d.beginPath();
    c2d.arc(
      this.position.x,
      this.position.y,
      this.radius,
      this.radians,
      Math.PI * 2 - this.radians
    );
    c2d.lineTo(this.position.x, this.position.y);
    c2d.fillStyle = "yellow";
    c2d.fill();
    c2d.closePath();
    c2d.restore();
  }
  update() {
    this.draw();
    this.position.x += this.movement.x;
    this.position.y += this.movement.y;
    if (this.radians < 0 || this.radians > 0.75) {
      this.chompRate = -this.chompRate;
    }
    this.radians += this.chompRate;
  }
}
class Ghost {
  constructor({ position, movement, color, eyes }) {
    this.prevCollisions = [];
    this.position = position;
    this.movement = movement;
    this.radius = 15;
    this.scared = false;
    this.color = color;
    this.eyes = eyes;
  }
  draw() {
    c2d.beginPath();
    c2d.arc(this.position.x, this.position.y, this.radius, 3, 6.4);
    c2d.lineTo(this.position.x + this.radius, this.position.y + this.radius);
    c2d.lineTo(
      this.position.x + this.radius / 2,
      this.position.y + this.radius / 2
    );
    c2d.lineTo(this.position.x, this.position.y + this.radius);
    c2d.lineTo(
      this.position.x - this.radius / 2,
      this.position.y + this.radius / 2
    );
    c2d.lineTo(this.position.x - this.radius, this.position.y + this.radius);
    c2d.fillStyle = this.scared ? "blue" : this.color;
    c2d.fill();
    c2d.closePath();
    ///EYES
    c2d.beginPath();
    c2d.arc(
      this.position.x - 5,
      this.position.y - 4,
      Math.floor(this.radius / 4),
      0,
      Math.PI * 2
    );
    c2d.fillStyle = this.scared ? "white" : this.eyes;
    c2d.fill();
    c2d.closePath();
    c2d.beginPath();
    c2d.arc(
      this.position.x + 5,
      this.position.y - 4,
      Math.floor(this.radius / 4),
      0,
      Math.PI * 2
    );
    c2d.fillStyle = this.scared ? "white" : this.eyes;
    c2d.fill();
    c2d.closePath();
  }
  update() {
    this.draw();
    this.position.x += this.movement.x;
    this.position.y += this.movement.y;
  }
}
class Cookie {
  constructor({ position }) {
    this.position = position;
    this.radius = 3;
  }
  draw() {
    c2d.beginPath();
    c2d.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c2d.fillStyle = "white";
    c2d.fill();
    c2d.closePath();
  }
}
class Cookiest {
  constructor({ position }) {
    this.position = position;
    this.radius = 5;
  }
  draw() {
    c2d.beginPath();
    c2d.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c2d.fillStyle = "white";
    c2d.fill();
    c2d.closePath();
  }
}
class Block {
  constructor({ position, image }) {
    this.position = position;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
    this.image = image;
  }
  evoque() {
    c2d.drawImage(this.image, this.position.x, this.position.y);
  }
  draw() {
    c2d.fillStyle = "blue";
    c2d.fillRect(this.position.x, this.position.y, TILE_SIZE, TILE_SIZE);
  }
}
///OBJECTS/////////////////////////////////////////////////////////////////
const pacman = new PacMan({
  position: {
    x: TILE_SIZE + TILE_SIZE / 2,
    y: TILE_SIZE + TILE_SIZE / 2,
  },
  movement: {
    x: 0,
    y: 0,
  },
});
const ghosts = [
  new Ghost({
    position: {
      x: TILE_SIZE * 9 + TILE_SIZE / 2,
      y: TILE_SIZE + TILE_SIZE / 2,
    },
    movement: { x: 0, y: GHOST_SPEED },
    color: "purple",
    eyes: "black",
  }),
  new Ghost({
    position: {
      x: TILE_SIZE + TILE_SIZE / 2,
      y: TILE_SIZE * 11 + TILE_SIZE / 2,
    },
    movement: { x: 0, y: -GHOST_SPEED },
    color: "green",
    eyes: "black",
  }),
  new Ghost({
    position: {
      x: TILE_SIZE * 9 + TILE_SIZE / 2,
      y: TILE_SIZE * 11 + TILE_SIZE / 2,
    },
    movement: { x: 0, y: -GHOST_SPEED },
    color: "red",
    eyes: "black",
  }),
];
const cookiests = [];
const cookies = [];
function getImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}
const blocks = [];
const map = [
  ["[", "=", "=", "=", "=", "=", "=", "=", "=", "=", "]"],
  ["|", ".", ".", ".", ".", ".", ".", ".", ".", "o", "|"],
  ["|", ".", "X", ".", "<", "T", ">", ".", "X", ".", "|"],
  ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
  ["|", ".", "<", ">", ".", ".", ".", "<", ">", ".", "|"],
  ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
  ["|", ".", "X", ".", "<", "#", ">", ".", "X", ".", "|"],
  ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
  ["|", ".", "<", ">", ".", ".", ".", "<", ">", ".", "|"],
  ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
  ["|", ".", "X", ".", "<", "L", ">", ".", "X", ".", "|"],
  ["|", "o", ".", ".", ".", ".", ".", ".", ".", "o", "|"],
  ["{", "=", "=", "=", "=", "=", "=", "=", "=", "=", "}"],
];
map.forEach((row, y) => {
  row.forEach((tile, x) => {
    switch (tile) {
      case "X":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/block.png"),
          })
        );
        break;
      case "[":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeCorner1.png"),
          })
        );
        break;
      case "]":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeCorner2.png"),
          })
        );
        break;
      case "{":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeCorner4.png"),
          })
        );
        break;
      case "}":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeCorner3.png"),
          })
        );
        break;
      case "=":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeHorizontal.png"),
          })
        );
        break;
      case "|":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeVertical.png"),
          })
        );
        break;
      case "<":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/capLeft.png"),
          })
        );
        break;
      case ">":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/capRight.png"),
          })
        );
        break;
      case "^":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/capTop.png"),
          })
        );
        break;
      case "_":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/capBottom.png"),
          })
        );
        break;
      case "#":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeCross.png"),
          })
        );
        break;
      case "T":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeConnectorBottom.png"),
          })
        );
        break;
      case "L":
        blocks.push(
          new Block({
            position: {
              x: TILE_SIZE * x,
              y: TILE_SIZE * y,
            },
            image: getImage("./img/pipeConnectorTop.png"),
          })
        );
        break;
      case ".":
        cookies.push(
          new Cookie({
            position: {
              x: TILE_SIZE * x + TILE_SIZE / 2,
              y: TILE_SIZE * y + TILE_SIZE / 2,
            },
          })
        );
        break;
      case "o":
        cookiests.push(
          new Cookiest({
            position: {
              x: TILE_SIZE * x + TILE_SIZE / 2,
              y: TILE_SIZE * y + TILE_SIZE / 2,
            },
          })
        );
        break;
    }
  });
});
///COLLISIONS//////////////////////////////////////////////////////////////
function circleCollidesCircle({ circle1, circle2 }) {
  return (
    Math.hypot(
      circle2.position.x - circle1.position.x,
      circle2.position.y - circle1.position.y
    ) <
    circle2.radius + circle1.radius
  );
}
function circleCollidesRectangle({ circle, rectangle }) {
  const padding = TILE_SIZE / 2 - circle.radius - 1;
  return (
    circle.position.y - circle.radius + circle.movement.y <=
      rectangle.position.y + rectangle.height + padding &&
    circle.position.y + circle.radius + circle.movement.y >=
      rectangle.position.y - padding &&
    circle.position.x - circle.radius + circle.movement.x <=
      rectangle.position.x + rectangle.width + padding &&
    circle.position.x + circle.radius + circle.movement.x >=
      rectangle.position.x - padding
  );
}
///ANIMATION///////////////////////////////////////////////////////////////
function animate() {
  animationFrameId = window.requestAnimationFrame(animate);
  c2d.clearRect(0, 0, map[0].length * TILE_SIZE, map.length * TILE_SIZE);
  for (let i = cookies.length - 1; i > 0; i--) {
    const cookie = cookies[i];
    cookie.draw();
    if (
      circleCollidesCircle({
        circle1: pacman,
        circle2: cookie,
      })
    ) {
      cookies.splice(i, 1);
      score += 10;
      scoreHTML.innerHTML = score;
    }
  }
  if (cookies.length === 1) {
    window.cancelAnimationFrame(animationFrameId);
  }
  for (let i = cookiests.length - 1; i >= 0; i--) {
    const cookiest = cookiests[i];
    cookiest.draw();
    if (circleCollidesCircle({ circle1: pacman, circle2: cookiest })) {
      cookiests.splice(i, 1);
      ghosts.forEach((ghost) => {
        ghost.scared = true;
        setTimeout(() => {
          ghost.scared = false;
        }, 5000);
      });
    }
  }
  if (keys.up.pressed && lastKey === "ArrowUp") {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (
        circleCollidesRectangle({
          circle: {
            ...pacman,
            movement: {
              y: -MOV_SPEED,
              x: 0,
            },
          },
          rectangle: block,
        })
      ) {
        pacman.movement.y = 0;
        break;
      } else {
        pacman.movement.y = -MOV_SPEED;
      }
    }
  } else if (keys.down.pressed && lastKey === "ArrowDown") {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (
        circleCollidesRectangle({
          circle: {
            ...pacman,
            movement: {
              y: MOV_SPEED,
              x: 0,
            },
          },
          rectangle: block,
        })
      ) {
        pacman.movement.y = 0;
        break;
      } else {
        pacman.movement.y = MOV_SPEED;
      }
    }
  } else if (keys.left.pressed && lastKey === "ArrowLeft") {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (
        circleCollidesRectangle({
          circle: {
            ...pacman,
            movement: {
              x: -MOV_SPEED,
              y: 0,
            },
          },
          rectangle: block,
        })
      ) {
        pacman.movement.x = 0;
        break;
      } else {
        pacman.movement.x = -MOV_SPEED;
      }
    }
  } else if (keys.right.pressed && lastKey === "ArrowRight") {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (
        circleCollidesRectangle({
          circle: {
            ...pacman,
            movement: {
              x: MOV_SPEED,
              y: 0,
            },
          },
          rectangle: block,
        })
      ) {
        pacman.movement.x = 0;
        break;
      } else {
        pacman.movement.x = MOV_SPEED;
      }
    }
  }
  blocks.forEach((block) => {
    block.evoque();
    if (circleCollidesRectangle({ circle: pacman, rectangle: block })) {
      pacman.movement.x = 0;
      pacman.movement.y = 0;
    }
  });

  ghosts.forEach((ghost, i) => {
    ghost.update();
    if (
      !ghost.scared &&
      circleCollidesCircle({ circle1: pacman, circle2: ghost })
    ) {
      window.cancelAnimationFrame(animationFrameId);
    } else if (
      ghost.scared &&
      circleCollidesCircle({ circle1: pacman, circle2: ghost })
    ) {
      ghosts.splice(i, 1);
    }
    const collisions = [];
    blocks.forEach((block) => {
      if (
        !collisions.includes("up") &&
        circleCollidesRectangle({
          circle: {
            ...ghost,
            movement: {
              x: 0,
              y: -GHOST_SPEED,
            },
          },
          rectangle: block,
        })
      ) {
        collisions.push("up");
      }
      if (
        !collisions.includes("down") &&
        circleCollidesRectangle({
          circle: {
            ...ghost,
            movement: {
              x: 0,
              y: GHOST_SPEED,
            },
          },
          rectangle: block,
        })
      ) {
        collisions.push("down");
      }
      if (
        !collisions.includes("left") &&
        circleCollidesRectangle({
          circle: {
            ...ghost,
            movement: {
              y: 0,
              x: -GHOST_SPEED,
            },
          },
          rectangle: block,
        })
      ) {
        collisions.push("left");
      }
      if (
        !collisions.includes("right") &&
        circleCollidesRectangle({
          circle: {
            ...ghost,
            movement: {
              y: 0,
              x: GHOST_SPEED,
            },
          },
          rectangle: block,
        })
      ) {
        collisions.push("right");
      }
    });
    if (collisions.length > ghost.prevCollisions.length) {
      ghost.prevCollisions = collisions;
    }
    if (collisions.toString() !== ghost.prevCollisions.toString()) {
      const pathways = ghost.prevCollisions.filter((collision) => {
        return !collisions.includes(collision);
      });
      if (ghost.movement.y < 0) {
        ghost.prevCollisions.push("up");
      } else if (ghost.movement.y > 0) {
        ghost.prevCollisions.push("down");
      } else if (ghost.movement.x < 0) {
        ghost.prevCollisions.push("left");
      } else if (ghost.movement.x > 0) {
        ghost.prevCollisions.push("right");
      }
      const direction = pathways[Math.floor(Math.random() * pathways.length)];
      switch (direction) {
        case "up":
          ghost.movement.y = -GHOST_SPEED;
          ghost.movement.x = 0;
          break;
        case "down":
          ghost.movement.y = GHOST_SPEED;
          ghost.movement.x = 0;
          break;
        case "left":
          ghost.movement.x = -GHOST_SPEED;
          ghost.movement.y = 0;
          break;
        case "right":
          ghost.movement.x = GHOST_SPEED;
          ghost.movement.y = 0;
          break;
      }
      ghost.prevCollisions = [];
    }
  });
  pacman.update();
  if (pacman.movement.y < 0) {
    pacman.rotation = Math.PI * 1.5;
  } else if (pacman.movement.y > 0) {
    pacman.rotation = Math.PI / 2;
  } else if (pacman.movement.x < 0) {
    pacman.rotation = Math.PI;
  } else if (pacman.movement.x > 0) {
    pacman.rotation = 0;
  }
}
animate();
///CONTROLS////////////////////////////////////////////////////////////////
window.addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "ArrowUp":
      keys.up.pressed = true;
      lastKey = "ArrowUp";
      break;
    case "ArrowDown":
      keys.down.pressed = true;
      lastKey = "ArrowDown";
      break;
    case "ArrowLeft":
      keys.left.pressed = true;
      lastKey = "ArrowLeft";
      break;
    case "ArrowRight":
      keys.right.pressed = true;
      lastKey = "ArrowRight";
      break;
  }
});
window.addEventListener("keyup", ({ key }) => {
  switch (key) {
    case "ArrowUp":
      keys.up.pressed = false;
      break;
    case "ArrowDown":
      keys.down.pressed = false;
      break;
    case "ArrowLeft":
      keys.left.pressed = false;
      break;
    case "ArrowRight":
      keys.right.pressed = false;
      break;
  }
});
