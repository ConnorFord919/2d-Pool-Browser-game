
document.addEventListener("DOMContentLoaded", function() {
    const playArea = document.getElementById("playArea");
    const UI = document.getElementById('playerUI');
    playArea.width = 800;
    playArea.height = 400;
    const ctx = playArea.getContext("2d");
    const ctxUI = UI.getContext('2d');
    let fpsInterval, startTime, now, then, elapsed;
    let balls = [];
    let inHand = true;
    const displayCurrentPlayer = document.getElementById('currentPlayer');
    let turnCount = 0;
    const mouse = {
        x: undefined,
        y: undefined
    };
    const getWhiteBall = () => {
        return balls.find((ball) => ball.color === 'white');
    }
    //server loot
    
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
    
    
    
    class Ball {
        constructor(x, y, color) {
            this.position = new Vector(x, y);
            this.mass = 0.01
            this.radius = 10;
            this.color = color;
            this.velocity = new Vector(0,0);
            this.threshold = 0.05;
            this.moving = false;
            this.inGoal = false;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
        handleCollision(other){
            if(inHand)return;
            const nVector = this.position.subtract(other.position);

            const distance = nVector.length();
            
            
            const overlap = nVector.multiplyByScalar(((this.radius * 2) - distance)/distance);

            this.position = this.position.add(overlap.multiplyByScalar(0.5));

            if(distance > this.radius*2) return;

            const unVector = nVector.multiplyByScalar(1/distance)

            const utVector = new Vector(-unVector.y, unVector.x);

            const v1n = unVector.dotProduct(this.velocity)
            const v1t = utVector.dotProduct(this.velocity)
            const v2n = unVector.dotProduct(other.velocity);
            const v2t = utVector.dotProduct(other.velocity);

            let v1nTag = v2n;
            let v2nTag = v1n;

            v1nTag = unVector.multiplyByScalar(v1nTag);
            const v1tTag = utVector.multiplyByScalar(v1t);
            v2nTag = unVector.multiplyByScalar(v2nTag);
            const v2tTag = utVector.multiplyByScalar(v2t);

           this.velocity = v1nTag.add(v1tTag)
           other.velocity = v2nTag.add(v2tTag)
        }

        update() {
            if(!inHand){
                pockets.forEach((pocket) => {
                    const sideA = Math.abs(this.position.y - pocket.y);
                    const sideB = Math.abs(this.position.x - pocket.x);
                    const distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
                    if(distance <= this.radius + pocket.radius) {
                        if(this.color !== 'white'){
                            if(this.color === 'black'){
                                endGame('loses');
                            }
                            else{
                                if(playerTurn === 1) playerOneScore.push(this);
                                else playerTwoScore.push(this);
                                balls.splice(balls.indexOf(this), 1);
                            }
                        }
                        else{
                            inHand = true;
                        } 
                    }
                })
                if(!this.inGoal){
                    if(this.position.x - this.radius + this.velocity.x < boundary.outCrop ||
                        this.position.x + this.radius + this.velocity.x > playArea.width - boundary.outCrop
                    ){
                        this.velocity.x = -this.velocity.x * 0.7;
                    }
                    if (
                        this.position.y + this.radius + this.velocity.y > playArea.height - boundary.outCrop ||
                        this.position.y - this.radius + this.velocity.y < boundary.outCrop
                        ) {
                        this.velocity.y = -this.velocity.y * 0.7; // some damping
                    } 
                }
                
                this.velocity = this.velocity.multiplyByScalar(0.98)
                if (this.velocity.length() < this.threshold) {
                    this.velocity = new Vector(0, 0);
                }
                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;
            }
            else{
                if(this.color === 'white'){
                    this.velocity = new Vector(0,0)
                    if(mouse.x < playArea.width/2 + 100 ){
                        if(turnCount === 0) mouse.x = playArea.width/2 + 100;
                    }
                    if(mouse.x > playArea.width - boundary.outCrop ) this.position.x = playArea.width -this.radius
                    this.position.x = mouse.x;
                    this.position.y = mouse.y;
                    if(turnCount === 0){
                        ctx.beginPath();
                        ctx.moveTo(playArea.width/2+100, 0);
                        ctx.lineTo(playArea.width/2+100, playArea.height);
                        ctx.stroke()
                        ctx.closePath();
                    }
                    playArea.addEventListener('mousedown',() => {
                        inHand = false;
                        console.log(this)
                    })
                }
                else{
                    this.position.x += this.velocity.x;
                    this.position.y += this.velocity.y;
                }
            }
            this.draw();
        }
    }
    class Cue {
        //Cue follows mouse around the white balls coordinates
        //on click lock rotation
        //increase the length of the cues hypotenuse to make it slide back proportional to the mouse going back'
        //once the cue reaches max power which will rise with hypotenuse length it will lock out
        //From there the cue can be released by unclicking the mouse
        //this will iniate an animation which hits the ball with the selected power 
        //we could use the tip of the cue, a small circle to collide
        //we will however use the power to calculate the balls velocity as opposed to the actual velocity
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
                balls.forEach((ball) => {
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
    class PowerBar{
        constructor() {
            this.power;
            this.barDim = new Vector(30, 300);
            this.barPos = new Vector(playArea.width-30, playArea.height-300);
        }
        draw(){
            //ctx.rect(this.barPos.x, this.barPos.y,this.barDim.x, this.barDim.y);
            ctxUI.fillStyle = 'yellow';
            ctxUI.rect(0, UI.height-30, UI.width,30)
            ctxUI.fill();
        }
        update(){
            console.log(this.power, cue.locked)
            ctxUI.clearRect(0,0, UI.width, UI.height)
            this.draw();
            if(cue.locked){
                const difference = Math.abs(cue.init - mouse.x);
                const power = difference/3;
                if(power > cue.threshold) powerBar.power = cue.threshold;
                //ctx.fillStyle = 'red'
                ctxUI.rect(0,UI.height-30,this.power*10, 30);
                ctxUI.stroke();
                //ctxUI.fill()
                powerBar.power = power;
            }
            else this.power = 0;
            
        }
    }
    class Pocket {
        constructor(x,y){
            this.x = x;
            this.y = y;
            this.radius = 20;
        }
        draw(){
            ctx.beginPath();
            ctx.fillStyle = "black";
            ctx.arc(this.x,this.y,this.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
        }
    }
    class Boundary {
        constructor(){
            this.outCrop = 10;
        }
        draw(){  
            ctx.rect(this.outCrop, this.outCrop, playArea.width - 2*this.outCrop, playArea.height - 2*this.outCrop)
            ctx.stroke()
        }
    }

    let playerTurn = 1;
    const cue = new Cue(10, 200, "brown");
    const powerBar = new PowerBar();
    const boundary = new Boundary();
    const pockets = [
        new Pocket(boundary.outCrop, playArea.height - boundary.outCrop),
        new Pocket(playArea.width - boundary.outCrop, playArea.height -  boundary.outCrop),
        new Pocket(boundary.outCrop,boundary.outCrop),
        new Pocket(playArea.width - boundary.outCrop, boundary.outCrop),
        new Pocket(playArea.width / 2 , 0),
        new Pocket(playArea.width / 2 , playArea.height),
    ]
    let playerOneScore = [];
    let playerTwoScore = [];
    
    playArea.addEventListener("mousedown", () => {
        cue.locked = true;
        cue.init = mouse.x;
    });
    playArea.addEventListener("mouseup", () => {
        cue.locked = false;
        const difference = Math.abs(cue.init - mouse.x);
        const power = difference/6;
        cue.power = power;
        if(cue.power > cue.maxPower) cue.power = cue.maxPower;
        cue.strike();
    });
    playArea.addEventListener("mousemove", function(e) {
        const rect = playArea.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    function init() {
        displayCurrentPlayer.innerText = `Player ${playerTurn} Starts` ;
        const newBall = (x,y,color) => balls.push(new Ball(x, y, color))
        const middleHeight = playArea.height/2;
        const trianglePos = 300;
        const ballColorsSolid = [ "red", "green", "orange", "purple", "brown", "yellow", "blue"];
        const ballColorStripes = [ "","","","","","","", "red", "green", "orange", "purple", "brown", "yellow", "blue"];
        newBall(trianglePos, middleHeight, "yellow");
        newBall(trianglePos-25 , middleHeight-15, "red");
        newBall(trianglePos-25 , middleHeight+15, "blue");
        newBall(trianglePos-60 , middleHeight, "black");
        newBall(trianglePos-60 , middleHeight+25, "purple");
        newBall(trianglePos-60 , middleHeight-25, "green");
        newBall(trianglePos-80 , middleHeight+15, "orange");
        newBall(trianglePos-80 , middleHeight-15, "yellow");
        newBall(trianglePos-80 , middleHeight-40, "blue");
        newBall(trianglePos-80 , middleHeight+40, "brown");
        newBall(trianglePos-105 , middleHeight-50, "brown");
        newBall(trianglePos-105 , middleHeight-25, "green");
        newBall(trianglePos-105 , middleHeight, "orange");
        newBall(trianglePos-105 , middleHeight+25, "purple");
        newBall(trianglePos-105 , middleHeight+50, "red");
        newBall(trianglePos + 200, middleHeight, "white")
        fpsInterval = 1000 / 120;
        then = Date.now();
        startTime = then;
        console.log(balls)
        animate();
    }
    console.log(balls)
    function endGame(outcome){
        window.alert(`Player ${playerTurn} ${outcome} `);
        playerOneScore = [];
        playerTwoScore = [];
        balls = [];
        init();
    }
    function ballCollidingWithBall(ball){
        balls.forEach((b) => {
            let sideA = Math.abs(ball.position.y - b.position.y);
            let sideB = Math.abs(ball.position.x - b.position.x);
            let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));

            if(distance <= ball.radius + b.radius && b !== ball) return ball.handleCollision(b);
        })
    }
    let fCount = 0;
    function animate() {
        now = Date.now();
        elapsed = now - then;
        requestAnimationFrame(animate);
        if (elapsed > fpsInterval) {
            fCount ++;
            then = now - (elapsed % fpsInterval);
            ctx.clearRect(0, 0, playArea.width, playArea.height);
            
            //apply instructions to each ball
            let ballPos = [];
            balls.forEach((b) => {
                ballPos.push(b.position);
            })
            balls.forEach((ball) => {
                ball.update();
                cue.cueCollidingWithBall(ball)
                ballCollidingWithBall(ball) 
            });
            
            powerBar.update();
            boundary.draw();
            pockets.forEach((pocket)=>{
                pocket.draw()
            })
            //update dues position to follow mouse
            if (mouse.x !== undefined && mouse.y !== undefined) {
                cue.update()
            }
        }
    }
    init();

});




