// constants of this canvas
const MAXWIDTH = 1000, MAXHEIGHT = 640, BLUE_SCORE = 5, PURPLE_SCORE = 10,
        BLACK_SCORE = 20, HORIZON_DIST = 50, CLICK_DIST = 25;

// variables for the timer
var time = 60, timerOn = 0;

// variables for the current level and score
var score = 200, level = 1;

// array for storing the sprites and blackholes
var sprites = new Array(), blackholes = new Array();

var myScore = document.getElementById("score");

// called when page loads and sets up event handlers
window.onload = function() {
    document.getElementById("finish").onclick = showStart;
    document.getElementById("start").onclick = showGame;
    document.getElementById("timerStart").onclick = startCount;
    document.getElementById("timerPause").onclick = stopCount;
    GameArea.canvas.onclick = removeBlackhole;
    startGame();
}

// onclick functions
function showGame() {
    document.getElementById("game-page").style.display = "block";
    document.getElementById("start-page").style.display = "none";
    document.getElementById("level-box").style.display = "none";
    timedCount();
}

function showStart() {
    document.getElementById("start-page").style.display = "block";
    document.getElementById("game-page").style.display = "none";
}

function startCount() {
    if (!timerOn) {
        timerOn = 1;
        timedCount();
    }
}

function stopCount() {
    clearTimeout(t);
    timerOn = 0;
}

// timer counts down evert 1 second
function timedCount() {
    document.getElementById("timer").innerHTML = time;
    time--;
    setTimeout(function() { timedCount() }, 1000);
}

// this class used for creating sprites 
class Component {
    constructor(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
}

class Blackhole extends Component {
    constructor(width, height, x, y, src) {
        super(width, height, x, y);
        this.src = src;
    }
    
    draw() {
        var ctx = GameArea.context;
        this.image = new Image();
        this.image.src = this.src;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Sprite extends Component {
    constructor(width, height, x, y, speedX, speedY, color) {
        super(width, height, x, y);
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }
    
    draw() {
        var ctx = GameArea.context;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    newPos() { // change position
        for (var i = 0; i < blackholes.length; i++) {
            if (this.x >= blackholes[i].x - HORIZON_DIST && 
                this.x <= blackholes[i].x + HORIZON_DIST && 
                this.y >= blackholes[i].y - HORIZON_DIST && 
                this.y <= blackholes[i].y + HORIZON_DIST) {
                var dx = blackholes[i].x - this.x;
                var dy = blackholes[i].y - this.y;
                this.speedX = dx / 5;
                this.speedY = dy / 5;
            }
        }
        this.x += this.speedX;
        this.y += this.speedY;
        
        for (var i = 0; i < blackholes.length; i++) {
            if (this.x >= blackholes[i].x - 10 && 
                this.x <= blackholes[i].x + 10 && 
                this.y >= blackholes[i].y - 10 && 
                this.y <= blackholes[i].y + 10) {
                var idx = sprites.indexOf(this);
                sprites.splice(idx, 1);
                score -= 50;
            }
        }  
        this.check();
    }

    check() { // check for boundary conditions
        var right = GameArea.canvas.width - this.width;
        var bottom = GameArea.canvas.height - this.height;

        // if (this.shape == "square") {
        //     if (this.x > right || this.x < this.width - HORIZON_DIST) {
        //         this.speedX = 0 - this.speedX ;
        //     }
        //     if (this.y > bottom || this.y < this.height) {
        //         this.speedY = 0 - this.speedY;
        //     }
         
        if (this.x > right || this.x < this.width) {
            this.speedX = 0 - this.speedX;
        }
        if (this.y > bottom || this.y < this.height + HORIZON_DIST) {
            this.speedY = 0 - this.speedY;
        }
        
    }
}


function startGame() {
    document.getElementById("level").innerHTML = level;
    GameArea.initializeCanvas();
    
    // store all the starting positions of the shapes
    var allPos = new Array();
    for (var i = 0; i < 10; i++) {
        var empty = [-1, -1];
        allPos.push(empty);
    }

    // generating 10 shapes
    var numSprites = 0;
    while (numSprites < 10) {
        var currShape = randgen("shape");
        var currX = randgen("x");
        var currY = randgen("y");
        var currSpeedX = randgen("speed");
        var currSpeedY = randgen("speed");

        var pos = new Array();
        pos.push(currX, currY);
        // regenerate starting position if it was alrea picked
        while (samePos(pos, allPos)) {
            currX = randgen("x");
            currY = randgen("y");
        }
        allPos.push(pos);

        // setting the values according to the shapes
        var currWidth;
        var currHeight;
        if (currShape == "square") {
            currWidth = 50;
            currHeight = 50;
        } else {
            currWidth = 25;
            currHeight = 25;
        }

        // generate random colour
        var currColour =randgen("colour");

        // create the sprite
        sprites.push(new Sprite(currWidth, currHeight, currX, currY, 
        currSpeedX, currSpeedY, currColour));

        numSprites++;
    }   
}

// check if x and y were the same in the previous position
function samePos(currPos, allPos) {
    for (var i = 0; i < 10; i++) {
        if (allPos[i][0] == currPos[0] && allPos[i][1] == currPos[1]) {
            return true;
        }
    }
    return false;
}

var GameArea = {
    canvas : document.createElement("canvas"),
    initializeCanvas() {
        this.canvas.width = MAXWIDTH;
        this.canvas.height = MAXHEIGHT;
        this.context = this.canvas.getContext("2d");
        let gamePage = document.getElementById("game-page");
        // insert canvas as the first child of game page
        gamePage.insertBefore(this.canvas, gamePage.childNodes[0]);

        this.frameNo = 0;
        // updateGameArea runs every 20th millisecond (50 times per second)
        setInterval(updateGameArea, 20);
        setInterval(generateBlackholes, 1000);
    },
    
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function updateGameArea() {
    GameArea.clearCanvas();
    GameArea.frameNo += 1;
    
    myScore.innerHTML = score;

    for (let i = 0; i < sprites.length; i++) {
        sprites[i].newPos();
        if (sprites[i] != null) {
           sprites[i].draw(); 
        }
    }
    
    for (let i = 0; i < blackholes.length; i++) {
        blackholes[i].draw();
    }
}

function generateBlackholes() {
    if (time == 10 || time == 20 || time == 30 || 
    time == 40 || time == 50 || time == 60) {
        blackholes.push(new Blackhole(50, 50, randgen("x"), randgen("y"), 
        "assets/img/blue.svg"));
    } else if (time == 45 || time == 30 || time == 15) {
        blackholes.push(new Blackhole(50, 50, randgen("x"), randgen("y"),
        "assets/img/purple.svg"));
    } else if (time == 30) {
        blackholes.push(new Blackhole(50, 50, randgen("x"), randgen("y"), 
        "assets/img/black.svg"));
    } 
}

// random generator
function randgen(purpose) {
    var i;
    // for shapes
    if (purpose == "shape") {
        i = Math.floor((Math.random() * 3));
        if (i == 0) {
            i = "circle";
        } else if (i == 1) {
            i = "square";
        } else {
            i = "star";
        }
    // for x starting position
    } else if (purpose == "x") {
        i = Math.floor(Math.random() * (MAXWIDTH - 100 + 1)) + 50;
    // for y starting position
    } else if (purpose == "y") {
        i = Math.floor(Math.random() * (MAXHEIGHT - 100 + 1)) + 50;
    // for speed
    } else if (purpose == "speed"){
        if (Math.random() >= 0.5) {
            i = 1;
        } else {
            i = -1;
        }
    // for colour only 5 though
    } else if (purpose == "colour"){
        var colourNum = Math.floor((Math.random() * 5));
        var col = ["red", "orange", "yellow", "green", "blue"];
        i = col[colourNum];
    }
    return i;
}


// remove blacholes from the array once clicked; assign scores given different
// kinds of blackholes clicked
function removeBlackhole(event) {
    var clickX = event.clientX - 10;
    var clickY = event.clientY - 10;
    
    for (let i = 0; i < blackholes.length; i++) {
        if (clickX >= blackholes[i].x - CLICK_DIST&& 
            clickX <= blackholes[i].x + CLICK_DIST && 
            clickY >= blackholes[i].y - CLICK_DIST && 
            clickY <= blackholes[i].y + CLICK_DIST) {
            var removed = blackholes.splice(i, 1); // remove one blackhole
            if ((removed[0].src)[11] == "b") { // blue
                score += BLUE_SCORE;
            } else if ((removed[0].src)[11] == "p") { // purple
                score += PURPLE_SCORE;
            } else {
                score += BLACK_SCORE;
            }
        }
    }
}

// else {
//             if (this.shape == "circle") {
//                 ctx.beginPath();
//                 ctx.arc(this.x, this.y, this.width, 0, 2*Math.PI);
//                 ctx.fillStyle = this.color;
//                 ctx.fill();
//             } else if (this.shape == "square") {
//                 ctx.fillStyle = this.color;
//                 ctx.fillRect(this.x, this.y, this.width, this.height);
//             } else if (this.shape == "star") {
//                 var rot = Math.PI/2*3;
//                 var x = this.x;
//                 var y = this.y;
//                 var spikes = 5;
//                 var step=Math.PI/spikes;
//                 var outerRadius = 25;
//                 var innerRadius = 10;

//                 ctx.beginPath();
//                 ctx.moveTo(this.x,this.y - outerRadius)
//                 for (var i = 0; i < spikes; i++){
//                     x = this.x + Math.cos(rot)*outerRadius;
//                     y = this.y + Math.sin(rot)*outerRadius;
//                     ctx.lineTo(x,y)
//                     rot+=step

//                     x = this.x + Math.cos(rot)*innerRadius;
//                     y = this.y + Math.sin(rot)*innerRadius;
//                     ctx.lineTo(x,y)
//                     rot += step
//                 }
//                 ctx.lineTo(this.x,this.y - outerRadius);
//                 ctx.closePath();
//                 ctx.lineWidth = 5;
//                 ctx.strokeStyle = this.color;
//                 ctx.stroke();
//                 ctx.fillStyle = this.color;
//                 ctx.fill();
//             }
//         }