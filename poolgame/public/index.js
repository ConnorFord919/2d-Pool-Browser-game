//env set up
const playArea = document.getElementById("playArea");
const ctx = playArea.getContext("2d");
playArea.width = 800;
playArea.height = 400;
const socket = io();

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
  }
class Cue {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.rotation = 0.1;
        this.initialPosition = new Vector(0, 0)
        this.initialTime = undefined;
        this.finalPosition = new Vector(0, 0);
        this.finalTime = undefined;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }
    update(){
        this.position.x = mouse.x;
        this.position.y = mouse.y;
        this.draw();
    }
    cueCollidingWithBall(ball) {
        if(ball.color === 'white'){
            let r = false;
            let sideA = Math.abs(mouse.y - ball.position.y);
            let sideB = Math.abs(mouse.x - ball.position.x);
            let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
            if(distance <= ball.radius + 5) r = true;
            
            if (r){
                cue.handleCueCollision(ball)
            }
                
        }
    }
    handleCueCollision(ball) {

        const ballVel = new Vector((this.initialPosition.x - mouse.x)/(this.initialTime - new Date())*10, (this.initialPosition.y - mouse.y)/(this.initialTime - new Date())*10)
        socket.emit('cueCollision', ballVel);
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
