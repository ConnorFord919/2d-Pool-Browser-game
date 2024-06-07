//Express dependancies
const express = require('express');
const app = express();
const port = 3001;

//socket.io dependancies
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname +'/index.html');
});

//game logic
//manage ball data then send it to the front end to draw

//classes

//env variables
const canvasWidth = 800;
const canvasHeight = 400;

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
  ballCollidingWithBall(){
    balls.forEach((b) => {
      if(b !== this){
        let sideA = Math.abs(this.position.y - b.position.y);
        let sideB = Math.abs(this.position.x - b.position.x);
        let distance = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));

        if(distance <= this.radius + b.radius) return this.handleCollision(b);
      }
    })
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
          this.position.y + this.radius + this.velocity.y > canvasHeight ||
          this.position.y - this.radius + this.velocity.y < 0
          ) {
          this.velocity.y = -this.velocity.y * 0.7; 
      } 
      //horizontal collisions
      if(
          this.position.x + this.radius + this.velocity.x > canvasWidth ||
          this.position.x - this.radius + this.velocity.x < 0
          ){
          this.velocity.x = -this.velocity.x * 0.7;
      }
      this.velocity = this.velocity.multiplyByScalar(0.99)
      this.position.y += this.velocity.y;
      this.position.x += this.velocity.x;
  }
}



//global variables
let balls = [];

//init
function init (){
  const middleHeight = canvasHeight / 2;
  const trianglePos = 500;
  balls = [];
  const newBall = (x,y,color) => balls.push(new Ball(x, y, color))
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
  newBall(trianglePos + 200, middleHeight, "white");
}

io.on('connection', (socket) => {
  init();

  socket.on('cueCollision', (ballVel) => {
    balls.forEach((ball) => {
      if(ball.color === 'white'){
        ball.velocity = new Vector(ballVel.x, ballVel.y)
      }
    })
  });

});
  setInterval(() => {
    if(balls.length > 0){
      //attempting to access properties prior to them existing as we are operating at 15ms
      balls.forEach((ball) => {
        ball.update();
        ball.ballCollidingWithBall();
      })
      io.emit('updateGame', balls);
    }
  }, 15);


server.listen(port, function() {
  console.log('Starting server on port', port);
});
