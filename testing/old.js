
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

            //pocket rectangle collisions
            //horizontal
            if(this.position.x + -this.radius + this.velocity.x < pockets.outCrop ||
                this.position.x + this.radius + this.velocity.x > playArea.width - pockets.outCrop
            ){
                this.velocity.x = -this.velocity.x * 0.7;
            }
            //vertical
            console.log('f')
            if (
                this.position.y + this.radius + this.velocity.y > playArea.height - pockets.outCrop ||
                this.position.y - this.radius + this.velocity.y < pockets.outCrop
                ) {
                    console.log('vertical collision')
                this.velocity.y = -this.velocity.y * 0.7; // some damping
            } 
            //horizontal collisions
            //if(
            //    this.position.x + this.radius + this.velocity.x > playArea.width ||
            //    this.position.x - this.radius + this.velocity.x < 0
            //    ){
            //    this.velocity.x = -this.velocity.x * 0.7;
            //}
            this.velocity = this.velocity.multiplyByScalar(0.98)
            if (this.velocity.length() < this.threshold) {
                this.velocity = new Vector(0, 0);
            }
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
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
            this.shot = true;
            const whiteBall = getWhiteBall();
            //this.prehitPos = this.position;
            const direction = whiteBall.position.subtract(cue.position).normalize();
            cue.velocity = direction.multiplyByScalar(this.power);
            whiteBall.moving = true;
        }
        draw() {
            const noMovement = () => {
                let flag = true;
                balls.forEach((ball) => {
                    if(!ball.velocity.isZero()) flag = false;
                })
                return flag;
            }
            if(noMovement()){
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
                ctx.fillStyle = 'white';
                ctx.fill();
            
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
            ctx.fillStyle = 'white';
            ctx.rect(playArea.width - 30, playArea.height - 300, 30,300)
            ctx.fill();
        }
        update(){
            this.draw();
            if(cue.locked){
                const difference = Math.abs(cue.init - mouse.x);
                const power = difference/3;
                if(power > cue.threshold) powerBar.power = cue.threshold;
                ctx.fillStyle = 'red'
                ctx.rect(playArea.width - 30, playArea.height - 300,30, this.power*10)
                ctx.fill()
                powerBar.power = power;
            }
            else this.power = 0;
            
            
        }
    }
    class Pockets {
        constructor(){
            
            this.outCrop = 60;
            this.pocketRadius = 20;
        }
        draw(){
            function drawPocket (x,y){
                const radius = 20;
                ctx.beginPath();
                ctx.fillStyle = "black";
                ctx.arc(x,y,radius, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.closePath();
            }
            drawPocket(this.outCrop, playArea.height - this.outCrop);

            drawPocket(playArea.width - this.outCrop, playArea.height -  this.outCrop);

            drawPocket(this.outCrop,this.outCrop);

            drawPocket(playArea.width - this.outCrop, this.outCrop);

            drawPocket(playArea.width / 2 , this.outCrop);

            drawPocket(playArea.width / 2 , playArea.height - this.outCrop);
            
            ctx.rect(this.outCrop, this.outCrop, playArea.width - 2*this.outCrop, playArea.height - 2*this.outCrop)
            ctx.stroke()
        
        }
        update(){
            this.draw();
        }

    }
    const cue = new Cue(10, 200, "brown");
    const powerBar = new PowerBar();
    const pockets = new Pockets();
    
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
            balls.forEach((ball) => {
                ball.update();
                cue.cueCollidingWithBall(ball)
                ballCollidingWithBall(ball) 
            });
            
            powerBar.update();
            pockets.update();
            //update dues position to follow mouse
            if (mouse.x !== undefined && mouse.y !== undefined) {
                cue.update()
            }
        }
    }
    init();

});




