document.addEventListener("DOMContentLoaded", function() {
    const playArea = document.getElementById("playArea");
    playArea.width = window.innerWidth;
    playArea.height = window.innerHeight;
    const ctx = playArea.getContext("2d");

    const friction = 0.009;
    const balls = [];
    const mouse = {
        x: undefined,
        y: undefined
    };

    class Ball {
        constructor(x, y, color) {
            this.x = x;
            this.mass = 0.01
            this.y = y;
            this.radius = 10;
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
            this.initialPosition = {x: undefined, y: undefined};;
            this.initialTime = undefined;
            this.finalPosition = {x: undefined, y: undefined};;
            this.finalTime = undefined;
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

    const cue = new Cue(10, 200, "brown");

    
    playArea.addEventListener("mousedown", () => {
        cue.initialPosition = {x: mouse.x, y: mouse.y};
        cue.initialTime = new Date();
    });
    playArea.addEventListener("mouseup", () => {
        cue.finalPosition = {x: mouse.x, y: mouse.y};
        cue.finalTime = new Date();

    });


    function init() {
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
        newBall(trianglePos-25, middleHeight-15, "red");
        newBall(trianglePos-25, middleHeight+15, "blue");
        newBall(trianglePos-60, middleHeight, "black");
        newBall(trianglePos-60, middleHeight+25, "purple");
        newBall(trianglePos-60, middleHeight-25, "green");
        newBall(trianglePos-80, middleHeight+15, "orange");
        newBall(trianglePos-80, middleHeight-15, "yellow");
        newBall(trianglePos-80, middleHeight-40, "blue");
        newBall(trianglePos-80, middleHeight+40, "brown");
        newBall(trianglePos-105, middleHeight-50, "brown");
        newBall(trianglePos-105, middleHeight-25, "green");
        newBall(trianglePos-105, middleHeight, "orange");
        newBall(trianglePos-105, middleHeight+25, "purple");
        newBall(trianglePos-105, middleHeight+50, "red");
        newBall(trianglePos + 200, middleHeight, "white")
        console.log(balls)


        animate();
    }

    function cueCollidingWithBall(ball, mouse) {
        let r = false;
            let sideA = Math.abs(mouse.y - ball.y);
            let sideB = Math.abs(mouse.x - ball.x);
            let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));

            if(distance <= ball.radius + 5) r = true;
        return r;
    }
    playArea.addEventListener("mousemove", function(e) {
        const rect = playArea.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    function handleQueCollision(ball) {
        if(cue.initialPosition !== undefined){
            ball.velx = (cue.initialPosition.x - mouse.x)/(cue.initialTime - new Date())*2;
            ball.vely = (cue.initialPosition.y - mouse.y)/(cue.initialTime - new Date())*2;
            cue.initialTime = undefined;
            cue.initialPosition = undefined;
            cue.finalPosition = undefined;
            cue.initialPosition = undefined;
        }
        
        
    }
    
    function ballCollidingWithBall(ball){
        balls.forEach((b) => {
            let sideA = Math.abs(ball.y - b.y);
            let sideB = Math.abs(ball.x - b.x);
            let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));

            if(distance <= ball.radius + b.radius && b !== ball) return handleBallCollision(ball, b);
        })
    }
    function handleBallCollision(ball, b){
            

        //normal vector 
        const nVectorY = (ball.y - b.y);
        const nVectorX =  (ball.x - b.x);
        const distance = Math.sqrt(Math.pow(nVectorX, 2) + Math.pow(nVectorY, 2));
        if(distance > ball.radius*2) return;
        const unVectorX = nVectorX * (1/distance);
        const unVectorY = nVectorY * (1/distance);

        const utVectorX = -unVectorY;
        const utVectorY = unVectorX;

        const v1nX = (unVectorX * ball.velx);
        const v1nY = (unVectorY * ball.vely);
        const v1tX = (utVectorX * ball.velx);
        const v1tY = (utVectorY * ball.vely);

        const v2nX = (unVectorX * b.velx);
        const v2nY = (unVectorY * b.vely);
        const v2tX = (utVectorX * b.velx);
        const v2tY = (utVectorY * b.vely);

        let v1nTagX = v1nX
        let v1nTagY = v1nY
        let v2nTagX = v2nX
        let v2nTagY = v2nY

        v1nTagX = unVectorX * v1nTagX;
        v1nTagY = unVectorY * v1nTagY;
        const v1tTagX = utVectorX * v1tX;
        const v1tTagY = utVectorY * v1tY;

        v2nTagX = unVectorX * v2nTagX;
        v2nTagY = unVectorY * v2nTagY;
        const v2tTagX = utVectorX * v2tX;
        const v2tTagY = utVectorY * v2tY;

        ball.velx = v1nTagX + v1tTagX;
        ball.vely = v1nTagY + v1tTagY;

        b.velx = v2nTagX + v2tTagX;
        b.vely = v2nTagY + v2tTagY;

        //const overlap = (ball.radius + b.radius) - distance;
        //ball.x = ball.x - (overlap/2);
        //ball.y = ball.y - (overlap/2);
        console.log('a', distance,(v2nTagX + v2tTagX), (v2nTagY + v2tTagY))
        //  console.log("b", b.velx, "ball", ball.velx)
        //  //const momentumIY = (ball.mass * (ball.vely-b.vely))
        //  //const momentumIX = (ball.mass * (ball.velx-b.velx))
        //  
        //  //console.log(momentumIX)
        ///
        //   
        //   //console.log('overlap', overlap)
        //   ////sum of radii - distance between the objects
        //   ////move both objects half their overlap
        //   
        //   
        //   //pf 
        //   //ball.x = ball.x - (overlap/2);
        //   //ball.y = ball.y - (overlap/2);
        //   //if(b.velx && b.vely === 0){
        //   //    
        //   //}
        //   //if(ball.velx === 0){
        //   //    return ball.velx -= 1;
        //   //}
        //   //if(b.velx === 0){
        //   //    return b.velx += 1;
        //   //}
        //  //ball.velx = -ball.velx
        //  //ball.vely = -ball.vely;
        //  ////b.velx = Math.random() * 5;
        //  ////b.vely = Math.random() * 5;
        //  //b.velx = -b.velx;
        //  //b.vely = -b.vely;
        //   function elasticCollision(m1, u1, m2, u2) {
        //       const v1 = (u1 * (m1 - m2) + 2 * m2 * u2) / (m1 + m2);
        //       const v2 = (u2 * (m2 - m1) + 2 * m1 * u1) / (m1 + m2);
        //       return { v1, v2 };
        //   }

        //   
        //   const resultX = elasticCollision(ball.mass, ball.velx, b.mass, b.velx);
        //   const resultY = elasticCollision(ball.mass, ball.vely, b.mass, b.vely);
        //   ball.velx = resultX.v1;
        //   b.velx = resultX.v2;
        //   ball.vely = resultY.v1;
        //   b.vely = resultY.v2;
        //   //b.velx = -b.velx
        //   //b.vely = -b.vely
        //   //const dx = b.x - ball.x;
        //   //const dy = b.y - ball.y;
        //   //console.log(dx, dy)
        //   //const distance = Math.sqrt(dx * dx + dy * dy);
        //   //const nx = dx/distance*2;
        //   //const ny = dy/distance*2;

        //   //const dvx = b.velx - ball.velx;
        //   //const dvy = b.vely - ball.vely;

        //   //const vn = dvx * nx + dvy * ny;

        //   //if (vn > 0 || b === ball) return;

        //   //const impulse = (2 * vn) / (1 + 1);

        //   //ball.velx -= impulse * nx;
        //   //ball.vely -= impulse * ny;
        //   //b.velx += (impulse * nx)/200;
        //   //b.vely += (impulse * ny)/200;
        //   //console.log(nx)
        //   //const overlap = ball.radius + b.radius - distance;
        //   //const correctionX = nx * overlap / 2;
        //   //const correctionY = ny * overlap / 2;
        //   //console.log(correctionX, correctionY)
        //   //ball.velx = -ball.velx;
        //   //ball.vely = -ball.vely;
        //   
        
    }

    function animate() {
        //clear display
        ctx.clearRect(0, 0, playArea.width, playArea.height);
        //apply instructions to each ball
        balls.forEach((ball) => {
            ball.update();
            if (cueCollidingWithBall(ball, mouse)) {
                handleQueCollision(ball);
            }
            ballCollidingWithBall(ball) 
        });
        //update dues position to follow mouse
        if (mouse.x !== undefined && mouse.y !== undefined) {
            cue.update()
        }
        requestAnimationFrame(animate);
    }
    init();
});

