
document.addEventListener("DOMContentLoaded", function() {
    const playArea = document.getElementById("playArea");
    playArea.width = window.innerWidth;
    playArea.height = window.innerHeight;
    const ctx = playArea.getContext("2d");
    let fpsInterval, startTime, now, then, elapsed;
    let balls = [];
    const mouse = {
        x: undefined,
        y: undefined
    };
    let currentPlayer = 1;
    //server loot
    const socket = io();
    
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
    
    
    
    class Ball {
        constructor(x, y, color) {
            this.position = new Vector(x, y);
            this.mass = 0.01
            this.radius = 10;
            this.color = color;
            this.velocity = new Vector(0,0);
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
        handleCollision(other){
            
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
            //vertical collisions
            if (
                this.position.y + this.radius + this.velocity.y > playArea.height ||
                this.position.y - this.radius + this.velocity.y < 0
                ) {
                    console.log('collided with ceiling or floor')
                this.velocity.y = -this.velocity.y * 0.7; // some damping
            } 
            //horizontal collisions
            if(
                this.position.x + this.radius + this.velocity.x > playArea.width ||
                this.position.x - this.radius + this.velocity.x < 0
                ){
                this.velocity.x = -this.velocity.x * 0.7;
            }
            this.velocity = this.velocity.multiplyByScalar(0.99)
            this.position.y += this.velocity.y;
            this.position.x += this.velocity.x;
            this.draw();
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
            const getWhiteBallPosition = () => {
                return balls.find((ball) => ball.color === 'white');
            }
            const whiteBall = getWhiteBallPosition();
            //ctx.save();
            //ctx.translate(mouse.x, mouse.y);
            //ctx.rotate(this.rotation)
            //ctx.beginPath();
            //ctx.arc(whiteBallPosition.x, whiteBallPosition.y, 30, 0, Math.PI * 2, false);
            ctx.fillStyle = 'white';
            //ctx.fill();
            
           // ctx.closePath();
            //ctx.restore();
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(whiteBall.position.x, whiteBall.position.y)
            ctx.stroke();
            ctx.closePath();
            
        }
        update(){

            this.draw();
        }
        cueCollidingWithBall(ball) {
            if(ball.color === 'white'){
                let r = false;
                let sideA = Math.abs(mouse.y - ball.position.y);
                let sideB = Math.abs(mouse.x - ball.position.x);
                let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
                if(distance <= ball.radius + 5) r = true;
                if (r)cue.handleCueCollision(ball)
            }
            
        }
        handleCueCollision(ball) {
            ball.velocity.x = (this.initialPosition.x - mouse.x)/(this.initialTime - new Date())*10;
            ball.velocity.y = (this.initialPosition.y - mouse.y)/(this.initialTime - new Date())*10;

        }
    }
    
    const cue = new Cue(10, 200, "brown");
    
    
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


    function init() {
        playArea.width = 800;
        playArea.height = 450;
        const newBall = (x,y,color) => balls.push(new Ball(x, y, color))
        const middleHeight = playArea.height/2;
        const trianglePos = 500;
        const ballColorsSolid = [ "red", "green", "orange", "purple", "brown", "yellow", "blue"];
        const ballColorStripes = [ "","","","","","","", "red", "green", "orange", "purple", "brown", "yellow", "blue"];
        //for (let i = 0; i < 13; i++) {
        //    if(i > 7) balls.push(new Ball((i * 50) , playArea.height/2, ballColorStripes[i]));
        //    else balls.push(new Ball((i * 50) ,playArea.height/2, ballColorsSolid[i])); 
        //}
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
        let ballPos = [];
        balls.forEach((b) => {
            ballPos.push(b.position);
        })
        socket.emit('initBalls', ballPos);
        animate();
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
            socket.emit('updateBalls', )
            balls.forEach((ball) => {
                ball.update();
                cue.cueCollidingWithBall(ball)
                ballCollidingWithBall(ball) 
            });
            //update dues position to follow mouse
            if (mouse.x !== undefined && mouse.y !== undefined) {
                cue.update()
            }
        }
    }
    init();

    socket.on('updateBalls', (newPos) => {
        balls.forEach((b, index) => {
            b.position = newPos[index];
            console.log(balls)
        })
    });


});




