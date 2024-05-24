/*class Ball {
    constructor(x, y, color) {
        this.radius = 10;
        this.x = x;
        this.y = y;
        this.velx = 0;
        this.vely = 0;
        this.mass = 0.165;
        this.color = color;
    }
    Draw(){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
    Update(){
        if (this.y + this.radius + this.dy > playArea.height) {
            this.dy = -this.dy * 0.9; // some damping
        } else {
            this.dy += gravity;
        }
        this.y += this.dy;
        this.Draw();
    }
}

class Cue {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    Draw(x,y){
        ctx.fillRect(x,y,100,300);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const playArea = document.getElementById("playArea");
    const ctx = playArea.getContext("2d");

    const gravity = 0.981;
    const balls = [];
    const cue = new Cue(10, 200);
    const mouse = {
        x: undefined,
        y: undefined
    }


    
    (function init(){
        const ballColors = ["black", "red", "green", "orange", "purple", "brown"];
        for(let i = 0; i < 6; i ++){
            balls.push(new Ball(playArea.width/2 + (i*30), playArea.height/2, ballColors[i]));
            balls[i].Draw();
        }
    })();
    playArea.addEventListener("mousemove", function(e){
        const rect = playArea.getBoundingClientRect();
        // Calculate mouse position relative to the canvas
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    })

    new Ball(300, 200, "white").Draw();

    function updateBalls() {
        balls.forEach((ball) => {
            if(ball.vely < 11.8) ball.vely += (gravity/10);
            if((ball.x-ball.radius) < 0 || (ball.x+ball.radius) > playArea.width) ball.velx = -ball.velx;
            if((ball.y-ball.radius) < 0){
                ball.vely += -ball.vely
                ball.vely += gravity;
            } 
            if((ball.y+ball.radius) > playArea.height){
                console.log(ball)
                ball.vely -= (ball.vely)
                ball.y = (playArea.height-ball.radius);
            }
            ball.y += ball.vely
            ball.Draw(); 
        })  

    }



    function animate(){
        //ctx.clearRect(0, 0, 500, 500);
        //updateBalls();
        //updateCue();
        ctx.clearRect(0, 0, playArea.width, playArea.height);
        balls.forEach(ball => ball.Update());
        requestAnimationFrame(animate);
    }
    animate();
});

*/
document.addEventListener("DOMContentLoaded", function() {
    const playArea = document.getElementById("playArea");
    playArea.width = window.innerWidth;
    playArea.height = window.innerHeight;
    const ctx = playArea.getContext("2d");

    const friction = 0.006;
    const balls = [];
    const mouse = {
        x: undefined,
        y: undefined
    };

    class Ball {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = 15;
            this.color = color;
            this.velx = 0;
            this.vely = 0; // velocity
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }

        update() {
            //vertical collisions
            if (
                this.y + this.radius + this.vely > playArea.height ||
                this.y - this.radius + this.vely < 0
                ) {
                this.vely = -this.vely * 0.7; // some damping
            } 
            //horizontal collisions
            if(
                this.x + this.radius + this.velx > playArea.width ||
                this.x - this.radius + this.velx < 0
                ){
                this.velx = -this.velx * 0.7;
            }
            if(this.velx > 0 || this.vely > 0){
                this.velx -= friction;
                this.vely -= friction;
            }
            if(this.velx < 0 || this.vely < 0){
                this.velx += friction;
                this.vely += friction;
            }
            
            this.y += this.vely;
            this.x += this.velx;
            this.draw();
        }
    }

    class Cue {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
        update(){
            this.draw();
        }

    }

    const cue = new Cue(10, 200);

    function init() {
        const ballColors = ["black", "red", "green", "orange", "purple", "brown"];
        for (let i = 0; i < 6; i++) {
            balls.push(new Ball(playArea.width / 2 + (i * 30), playArea.height / 2, ballColors[i]));
        }
        animate();
    }

    function cueCollidingWithBall(ball, mouse) {
       
        const halfSquareSize = 25;
        
        // Calculate the closest point on the square to the center of the ball
        const closestX = Math.max(mouse.x - halfSquareSize, Math.min(ball.x, mouse.x + halfSquareSize));
        const closestY = Math.max(mouse.y - halfSquareSize, Math.min(ball.y, mouse.y + halfSquareSize));
        // Calculate the distance from the closest point to the center of the ball
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Check if the distance is less than the ball's radius
        return distance < ball.radius;
    }
    playArea.addEventListener("mousemove", function(e) {
        const rect = playArea.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    function handleQueCollision(ball) {
        //we need the direction the ball is hit toward 
        //if going right and up slightly then x = 1, y= 0.1 for example



        const relativeX = ball.x - mouse.x;
        const relativeY = ball.y - mouse.y;
        console.log(relativeX)
        if (relativeX < 0) ball.velx = -1;
        else ball.velx = 1;
        if (relativeY < 0)ball.vely = -1;
        else ball.vely = 1;
            
    }
    
    function ballCollidingWithBall(ball, allBalls){
        let r = false;
        allBalls.forEach((b) => {
            if(Math.abs(ball.x - b.x) <= (ball.radius + b.radius)) r = true;
        })
        return r;
    }
    function handleBallCollision(){
        //use momentum in two planes equation to get x and y velocity for final ball
    }

    function animate() {
        //clear display
        ctx.clearRect(0, 0, playArea.width, playArea.height);
        //apply instructions to each ball
        balls.forEach((ball, index) => {
            ball.update();
            if (cueCollidingWithBall(ball, mouse)) {
                handleQueCollision(ball);
            }
            if(ballCollidingWithBall(ball, balls.splice(1, index))) handleBallCollision(ball);
        });
        //update dues position to follow mouse
        if (mouse.x !== undefined && mouse.y !== undefined) {
            cue.update()
        }
        requestAnimationFrame(animate);
    }
    init();
});

