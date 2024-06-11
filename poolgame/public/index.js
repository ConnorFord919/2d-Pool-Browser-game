//env set up
const playArea = document.getElementById("playArea");
const ctx = playArea.getContext("2d");
playArea.width = 800;
playArea.height = 400;
const socket = io();

const getWhiteBall = () => {
    return ballsLocal.find((ball) => ball.color === 'white');
}


//classes
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(otherVector){
        return new Vector(this.x + otherVector.x , this.y + otherVector.y);
    }
    addTo(otherVector){
        this.x += otherVector.x;
        this.y += otherVector.y;
    }
    subtract(otherVector) {
        return new Vector (this.x - otherVector.x, this.y - otherVector.y);
    }
    multiplyByScalar(scalar){
        return new Vector(this.x * scalar, this.y * scalar);
    }
    dotProduct(otherVector){
        return this.x * otherVector.x + this.y * otherVector.y;
    }
    length(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    isZero(){
        if (this.x === 0 && this.y === 0) return true;
        else return false;
    }
    normalize() {
        const length = this.length();
        return new Vector(this.x / length, this.y / length);
    }
}
  class Cue {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.rotation = 0.1;
        this.outerRadius = 50;
        this.locked = false;
        this.init = undefined;
        this.power = 0;
        this.shot = false;
        this.maxPower = 20;
    }
    strike(){
        const whiteBall = getWhiteBall();
        console.log(whiteBall.moving)
        if(!this.locked && this.power > 0.01){
            this.shot = true;
            //this.prehitPos = this.position;
            const direction = whiteBall.position.subtract(cue.position).normalize();
            cue.velocity = direction.multiplyByScalar(this.power);
            whiteBall.moving = true;
            if(playerTurn === 1) playerTurn = 2;
            else playerTurn = 1;   
            turnCount ++; 
            displayCurrentPlayer.innerText = `Player ${playerTurn}`;
        }   
    }
    draw() {
        const noMovement = () => {
            let flag = true;
            ballsLocal.forEach((ball) => {
                if(!ball.velocity.isZero()) flag = false;
            })
            return flag;
        }
        if(noMovement() && !inHand){
            ctx.beginPath();
            ctx.fillStyle = 'white';
            ctx.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, false);
            ctx.fill();
            if(!this.locked){
                ctx.lineWidth = '3';
                ctx.moveTo(this.position.x, this.position.y);
                ctx.lineTo(this.position.x + (this.position.x - mouse.x),this.position.y + (this.position.y - mouse.y));
                ctx.stroke();
            }
            ctx.strokeStyle = 'black'
            ctx.lineWidth = '1'
            if(!cue.locked){
                ctx.moveTo(this.position.x, this.position.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
            ctx.closePath();
        }
    }
    update(){
        const whiteBall = getWhiteBall();
        const relv = new Vector(whiteBall.position.x - mouse.x, whiteBall.position.y - mouse.y);

        const angle = Math.atan2(relv.y, relv.x);
        // Calculate the position of the cue ball at a fixed radius from the white ball
        if(!this.locked && !this.shot){
            this.position.x = mouse.x;
            this.position.y = mouse.y;
            this.position.x = whiteBall.position.x + this.outerRadius * Math.cos(angle)
            this.position.y = whiteBall.position.y + this.outerRadius * Math.sin(angle) 
        }
        if(this.shot){
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        } 
        // 10 pixels away in the x direction
        // 10 pixels away in the y direction
        // Calculate the angle in radians
        this.draw(); // Draw the cue at the new origin and rotation
    }
    cueCollidingWithBall(ball) {
        if(ball.color === 'white'){
            let r = false;
            let sideA = Math.abs(cue.position.y - ball.position.y);
            let sideB = Math.abs(cue.position.x - ball.position.x);
            let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
            if(distance <= ball.radius + 5){
                this.shot = false;
                r = true;
            } 
            if (r)cue.handleCueCollision(ball)
        }
    }
    handleCueCollision(ball) {
       //console.log(this.velocity)
       //const relv = cue.position.subtract(ball.position);
       //const angle = Math.atan2(relv.y, relv.x); // Calculate the angle in radians
        ball.handleCollision(cue);
        //ball.velocity.x = this.power * Math.cos(angle);
        //ball.velocity.y = this.power * Math.sin(angle);
    }
}
//global variables
let ballsLocal = [];
const mouse = {
    x : undefined,
    y : undefined
}
const cue = new Cue(7, 0);


playArea.addEventListener("mousemove", function(e) {
    const rect = playArea.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
playArea.addEventListener("mousedown", () => {
    cue.initialPosition.x = mouse.x;
    cue.initialPosition.y = mouse.y;
    cue.initialTime = new Date();
});
playArea.addEventListener("mouseup", () => {
    cue.finalPosition.x = mouse.x;
    cue.finalPosition.y = mouse.y; 
    cue.finalTime = new Date();
});




socket.on('updateGame', (balls) => {
    ballsLocal = balls
    ctx.clearRect(0, 0, playArea.width, playArea.height);
    ballsLocal.forEach((ball) => {
        cue.cueCollidingWithBall(ball)
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    })
    cue.update();
})
