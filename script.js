const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".main-nav");

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
}

const canvas = document.querySelector("#webgl-canvas");
const gl = canvas.getContext("webgl2");

if (gl) {
  const vertexShaderSource = `#version 300 es
    in vec2 aPosition;
    in vec3 aColor;
    uniform vec2 uTranslation;
    out vec3 vColor;
    void main() {
      gl_Position = vec4(aPosition + uTranslation, 0.0, 1.0);
      vColor = aColor;
    }
  `;

  const fragmentShaderSource = `#version 300 es
    precision highp float;
    in vec3 vColor;
    out vec4 outColor;
    void main() {
      outColor = vec4(vColor, 1.0);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);

  const vertices = new Float32Array([
     0.00,  0.28,  0.55, 0.31, 0.95,
    -0.28,  0.00,  0.98, 0.39, 0.28,
     0.00, -0.28,  1.00, 0.70, 0.28,
     0.28,  0.00,  0.72, 0.38, 0.98
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const colorLocation = gl.getAttribLocation(program, "aColor");
  const translationLocation = gl.getUniformLocation(program, "uTranslation");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 20, 8);

  const movement = { x: 0, y: 0 };
  const speed = 0.09;

  function move(direction) {
    if (direction === "left") movement.x -= speed;
    if (direction === "right") movement.x += speed;
    if (direction === "up") movement.y += speed;
    if (direction === "down") movement.y -= speed;
    movement.x = Math.max(-0.7, Math.min(0.7, movement.x));
    movement.y = Math.max(-0.65, Math.min(0.65, movement.y));
  }

  window.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down"
    };
    if (directions[event.key]) {
      event.preventDefault();
      move(directions[event.key]);
    }
  });

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => move(button.dataset.direction));
  });

  function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.055, 0.047, 0.094, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(translationLocation, movement.x, movement.y);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    requestAnimationFrame(render);
  }

  render();
} else {
  canvas.insertAdjacentHTML("afterend", "<p class='webgl-error'>WebGL 2.0 is not available in this browser.</p>");
}
