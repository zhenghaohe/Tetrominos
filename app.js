let gl;
let program;
let canvas = document.getElementById('canvas');
let positionBuffer;
let colorBuffer;
let currentTetromino;
let exisiting = [];
let exisitingColours = [];
let dropCounter = 0;
let dropInterval = 1000; // 1s
let lastTime = 0;

const ctx = document.querySelector('#back').getContext('2d');
const coloursMap = {
    'E':[0.845,0.664,0.211, 1.0],
    'B': [0.036,0.722,0.790, 1.0],
    'O':[0.298,0.239,0.700, 1.0],
    'P': [0.577,0.441,0.700, 1.0],
    'R': [0.985,0.693,0.852, 1.0],
    'Y': [0.980,0.603,0.086, 1.0],
    'C': [0.925,0.184,0.381, 1.0],
    'G': [0.397,0.820,0.508, 1.0],
};
const SIZE_PER_POINT = 20; // 20px per point
const NUMBER_OF_POINT_PER_ROW = this.canvas.width/ SIZE_PER_POINT;
const UPPER_BOUND = 30;
const LEFT_BOUND = 10;
const RIGHT_BOUND = 190;
const LOWER_BOUND = 390;

function drawGrid(ctx) {
    // draw grid
    ctx.translate(0,0);
    ctx.beginPath();
    for (let i = 0; i < 401; i += 20) {
        ctx.moveTo(0, i);
        ctx.lineTo(400, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 400);
    }
    ctx.strokeStyle = "black";
    ctx.stroke();
}

const vShaderSource = `#version 300 es
    in vec2 vPosition;
    uniform vec2 uResolution;
    in vec4 fColor;
    out vec4 out_fColor;
        
    void main() {
        gl_Position = vec4(
        (2.0*((vec2(vPosition.x,vPosition.y))/uResolution)-1.0)*vec2(1.0,-1.0), 
        0, 
        1.0);
        gl_PointSize = 20.0;
        out_fColor = fColor;
    }
`;

const fShaderSource = `#version 300 es
    precision mediump float;
    in vec4 out_fColor;
    out vec4 fColor;
    
    void main() {
        fColor = out_fColor;
    }
`;


function checkIfGameEnds() {
    return currentTetromino.matrix.some(point => point[1]<UPPER_BOUND);
}

class Tetromino {
    constructor() {
        this.matrix = [];
    }

    rotate() {
        const newMatrix = this.matrix.map((point, index) => {
            if(index === this.centerIndex) return point;
            const newX = this.matrix[this.centerIndex][0] + point[1] - this.matrix[this.centerIndex][1];
            const newY = this.matrix[this.centerIndex][1] + this.matrix[this.centerIndex][0] - point[0];
            return [newX, newY];
        });
        const ableToMove = this.validateMove(newMatrix);

        if(ableToMove) {
            this.matrix = newMatrix;
        }
    }

    move(dir) {
        if(dir === 'd')   dropCounter = 0;

        const newMatrix = this.matrix.map( point => dirMap[dir](point));
        const ableToMove = this.validateMove(newMatrix);

        if(ableToMove) {
            this.matrix = newMatrix;
        } else if(dir === 'd') {
            if(checkIfGameEnds()) {
                resetGameBoard();
                return;
            }
            newTetrominos();
            const rowsToRemove = checkForRowsToRemove();
            if(rowsToRemove.length > 0) {
                cleanGameBoard(rowsToRemove.sort());
            }
        }
    }

    getColourMatrix() {
        return new Array(4).fill(coloursMap[currentTetromino.colour]);
    }

    validateMove(matrix) {
        const matrixStringfied = matrix.map(JSON.stringify);
        const exisitingPoints = exisiting.map(JSON.stringify);
        const isNotCollided = !matrixStringfied.filter(point => exisitingPoints.includes(point)).length;
        const isNotOutOfBound = matrix.every(point => point[0] >= LEFT_BOUND
            && point[0] <= RIGHT_BOUND
            && point[1] <= LOWER_BOUND);

        return isNotCollided && isNotOutOfBound;
    }
}


class TetrominoI extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [70, 10],
            [90, 10],
            [110, 10],
            [130, 10],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'B';
        this.centerIndex = 2;
    }
}

class TetrominoT extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [70, 10],
            [90, 10],
            [110, 10],
            [90, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'O';
        this.centerIndex = 1;
    }
}

class TetrominoL extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [70, 10],
            [90, 10],
            [110, 10],
            [70, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'P';
        this.centerIndex = 1;
    }
}

class TetrominoJ extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [70, 10],
            [90, 10],
            [110, 10],
            [110, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'R';
        this.centerIndex = 1;
    }
}

class TetrominoZ extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [70, 10],
            [90, 10],
            [90, 30],
            [110, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'Y';
        this.centerIndex = 1;
    }
}

class TetrominoS extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [110, 10],
            [90, 10],
            [90, 30],
            [70, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'G';
        this.centerIndex = 1;
    }
}

class TetrominoO extends Tetromino {
    constructor() {
        super();
        this.initialmMatrix = [
            [90, 10],
            [110, 10],
            [90, 30],
            [110, 30],
        ];
        this.matrix = this.initialmMatrix;
        this.numberOfSquares = 4;
        this.colour = 'E';
        this.centerIndex = 1;
    }
    rotate(){
        // disable rotate for this tetromino
    }
}

function newTetrominos() {
    if(currentTetromino) {
        exisiting.push(...currentTetromino.matrix);
        exisitingColours.push(...currentTetromino.getColourMatrix());
    }

    const tetrominos =
        [new TetrominoI(), new TetrominoJ(), new TetrominoL(), new TetrominoS(), new TetrominoZ(), new TetrominoO(), new TetrominoT()];
    currentTetromino = tetrominos[Math.floor(Math.random()*tetrominos.length)];
}


function sendPositionBufferData(points) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
}

function sendColorBufferData(colour) {
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colour), gl.STATIC_DRAW);
}

function getGLContext() {
    gl = canvas.getContext('webgl2');
    if(gl) {
        gl.clearColor(0.980,0.972,0.896, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
    } else {
        console.error('webgl2 not supported!');
    }
}

function initShaders() {
    // compile source
    const vShader = makeShader(vShaderSource, gl.VERTEX_SHADER);
    const fShader = makeShader(fShaderSource, gl.FRAGMENT_SHADER);

    // create program
    program = gl.createProgram();

    //attach and link shaders to the program
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    //use program
    gl.useProgram(program);
}

function makeShader(src, type) {
    //compile the vertex shader
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

const dirMap = {
    'r': function (prevCenter) {
        return [prevCenter[0]+SIZE_PER_POINT, prevCenter[1]+0];
    },
    'd': function (prevCenter) {
        return [prevCenter[0], prevCenter[1]+SIZE_PER_POINT];
    },
    'l': function (prevCenter) {
        return [prevCenter[0]-SIZE_PER_POINT, prevCenter[1]];
    },
};

function setBuffer() {
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);

    const fColor = gl.getAttribLocation(program, 'fColor');
    gl.enableVertexAttribArray(fColor);
    gl.vertexAttribPointer(fColor, 4, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'uResolution');
    gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);

    document.addEventListener('keydown', (ev) => keyDown(ev, positionBuffer), false);
}

function drawStableTetrominos() {
    sendPositionBufferData(exisiting.flat());
    sendColorBufferData(exisitingColours.flat());
    gl.drawArrays(gl.POINTS, 0, exisiting.length);
}

function drawCurrenttTetromino() {
    sendPositionBufferData(currentTetromino.matrix.flat());
    sendColorBufferData(currentTetromino.getColourMatrix().flat());
    gl.drawArrays(gl.POINTS, 0, currentTetromino.matrix.length);
}
function keyDown(ev) {
    let dir = '';
    switch(ev.key) {
        case 'ArrowUp':
            dir = 'u';
            currentTetromino.rotate();
            break;
        case 'ArrowDown':
            dir = 'd';
            currentTetromino.move(dir);
            break;
        case 'ArrowRight':
            dir = 'r';
            currentTetromino.move(dir);
            break;
        case 'ArrowLeft':
            dir = 'l';
            currentTetromino.move(dir);
            break;
        case ' ':
            dir = '\s';
            newTetrominos();
            break;
    }
}

function checkForRowsToRemove() {
    const countMap = {};
    exisiting.forEach(point => {
        countMap[point[1]] ? countMap[point[1]]++ : countMap[point[1]] = 1;
    });

    const rowsToRemove = Object.keys(countMap).filter((row) => {
        return countMap[row] === NUMBER_OF_POINT_PER_ROW;
    });

    return rowsToRemove;
}

function cleanGameBoard(rowsToRemove) {
   const indicesForColoursToBeCleaned = exisiting
       .map((point, index) => rowsToRemove.includes(point[1].toString()) && index)
       .filter(point => typeof point === 'number');
    const rows = rowsToRemove.length * SIZE_PER_POINT;

    exisitingColours = exisitingColours.filter(
        (_, index) => indicesForColoursToBeCleaned.indexOf(index) === -1
    );
    exisiting = exisiting.filter(
        points => !rowsToRemove.includes((points[1]).toString())
    );
    exisiting = exisiting.map(point => {
        if(point[1] < Number(rowsToRemove[0])) {
            point[1] += rows;
        }
        return point;
    });
}

function resetGameBoard() {
    exisiting = [];
    exisitingColours = [];
    currentTetromino = null;
    newTetrominos();
}

window.onload = function() {
    drawGrid(ctx);
    getGLContext();
    initShaders();
    setBuffer();
    newTetrominos();
    update();
};

function update(time = 0) {
    const deltaTime = time - lastTime; // 16ms
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
       currentTetromino.move('d');
    }
    lastTime = time;

    gl.clear(gl.COLOR_BUFFER_BIT );
    exisiting.length && drawStableTetrominos();
    drawCurrenttTetromino();
    gl.drawArrays(gl.POINTS, 0, 4);

    //drawGrid(ctx);
    requestAnimationFrame(update);
}

