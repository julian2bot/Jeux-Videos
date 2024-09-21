if(window.innerHeight < 700 && window.innerWidth < 1167){
    hauteur = window.innerHeight;
    largeur =  hauteur * 1.78;
    if(window.innerWidth < largeur){
        largeur =  window.innerWidth;
        hauteur = largeur / 1.78;
    }
}
else{
    hauteur = 500;
    largeur = hauteur * 1.78 ;
}

const config= {
    width:largeur, // à definir 700
    height:hauteur, // à definir 600
    type: Phaser.AUTO,
    scene :{
        preload: preload,
        create :create,
        update: update
    },
    physics:{   
        default: "arcade",
        arcade:{
            gravity:{
                x: 0,
                y: 0
            },
            debug: false
        }
    }
}

var game = new Phaser.Game(config);
let playerD;
let playerG;
let ball;
let scoreTextD;
let scoreTextG;
let scoreTextGameOver;
let cursors;
let speed = 400;
let speedBall = 400;
let start = true;
let pointsMax = 8;
let GameOverBool = false;


points = [
    {
        name:"joueur2 Droit",
        nbPoint:0,
        nbPointMax:0, 
        win: false
    },
    {
        name:"joueur1 Gauche",
        nbPoint:0,
        nbPointMax:0,
        win: false
    }
]

function preload(){

    this.load.image('ball', 'assets/imagePong/ball.png');
    // PLAYER
    this.load.image('player', 'assets/imagePong/joueur.png');

}



function create(){

    // ball
    ball = this.physics.add.image(config.width*.5,config.height*.5, "ball");
    // ball.setOrigin(0.5,0.5);
    ball.setOrigin(0.5,0.5);
    ball.setCircle(4);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);

    

    // player
    playerD = this.physics.add.sprite(config.width*.9, config.height*.5, "player");
    playerD.setCollideWorldBounds(true);


    playerG = this.physics.add.sprite(config.width*.1, config.height*.5, "player");
    playerG.setCollideWorldBounds(true);
    
    this.physics.add.collider(playerD, ball, function() {
        maintainSpeed(ball);
    });

    this.physics.add.collider(playerG, ball, function() {
        maintainSpeed(ball);
    });

    playerD.setImmovable(true); 
    playerG.setImmovable(true); 


    this.input.keyboard.on('keydown', function (event) {
        if(GameOverBool === false){
            move(event.key);
        }
        else if(GameOverBool === true && event.key === "Enter"){
            restart();
        }
    });

    this.input.keyboard.on('keyup', function (event) {
        stopMove(event.key);
    });

    scoreTextD = this.add.text(0, 0, `score: ${points[1].nbPoint}\nMax: ${points[1].nbPointMax}`, { fontSize: '32px', fill: '#fff' });
    scoreTextD.setPosition(config.width - scoreTextD.width - 16, 16);


    scoreTextG = this.add.text(0, 0, `score: ${points[0].nbPoint}\nMax: ${points[0].nbPointMax}`, { fontSize: '32px', fill: '#fff' });    
    scoreTextG.setPosition(16, 16);

    // scoreTextGameOver = this.add.text(200, 200, `GameOver`, { fontSize: '32px', fill: '#fff' });
    scoreTextGameOver = this.add.text((this.physics.world.bounds.width / 2) + 55, this.physics.world.bounds.height / 2, 'Game Over\nPress Enter', { fontSize: '26px', fill: '#fff', align:"center" });
    scoreTextGameOver.setOrigin(1,1); 
    scoreTextGameOver.setVisible(false); 

}

function update(){

    if(points[0].win === true || points[1].win === true){
        ball.setVelocity(0,0);
    }

    if(ball.body.blocked.right){
        points[0].win = true;
        ball.setVelocity(0,0);
        ball.setPosition(playerD.x-10,playerD.y) 
        points[1].nbPoint = points[1].nbPoint +1;
        if(points[1].nbPoint>points[1].nbPointMax){
            points[1].nbPointMax = points[1].nbPoint;
        }
        scoreTextG.setText(`score: ${points[1].nbPoint}\nMax: ${points[1].nbPointMax}`);
        GameOver();
    }
    else if(ball.body.blocked.left){
        points[1].win = true;
        ball.setVelocity(0,0);
        ball.setPosition(playerG.x+10,playerG.y)

        points[0].nbPoint = points[0].nbPoint + 1;
        if(points[0].nbPoint>points[0].nbPointMax){
            points[0].nbPointMax = points[0].nbPoint;
        }
        scoreTextD.setText(`score: ${points[0].nbPoint}\nMax: ${points[0].nbPointMax}`);
        GameOver();
    }

}

function move(touche){

    switch(touche){
        case "z":
        case "Z":
            playerG.setVelocityY(-speed);
            break;
        
        case "s":
        case "S":
            playerG.setVelocityY(speed);
            break;
        
        case "ArrowUp":
            playerD.setVelocityY(-speed);
            break;
        
        case "ArrowDown":
            playerD.setVelocityY(speed);
            break;

        default:
            break;
    }
    
}

function stopMove(touche) {

    switch (touche) {
        case "z":
        case "Z":
        case "s":
        case "S":

            playerG.setVelocity(0,0);
            break;

        case "ArrowUp":
        case "ArrowDown":
            playerD.setVelocity(0,0); 
            break;

        case " ":
            let angleDeg;

            if(start === true){
                if (Phaser.Math.Between(0, 1) === 0) {
                    angleDeg = Phaser.Math.Between(80, 100);
                } else {
                    angleDeg = Phaser.Math.Between(260,280);
                }

                startFunc(angleDeg);
                start= false;
            }
            else if(points[0].win === true){
                // start ball gauche

                points[0].win = false;
                angleDeg = Phaser.Math.Between(80, 100);
                ball.setPosition(playerD.x-15,playerD.y)
                
                if(!GameOverBool){
                    startFunc(angleDeg)

                }
            }
            else if(points[1].win === true){
                // start ball droit

                points[1].win = false;
                angleDeg = Phaser.Math.Between(260,280);
                ball.setPosition(playerG.x+10,playerG.y)
                if(!GameOverBool){
                    startFunc(angleDeg)

                }
            }
            else{
                // pass
            }

        default:
            break;
    }

}
function maintainSpeed(ball) {

    const angle = Math.atan2(ball.body.velocity.y, ball.body.velocity.x); 
    ball.setVelocity((speedBall * Math.cos(angle))* 1.1, (speedBall * Math.sin(angle))* 1.1); 

}


function startFunc(angleDeg){

    const velocityX = speedBall * Math.cos(angleDeg);
    const velocityY = speedBall * Math.sin(angleDeg);
    
    ball.setVelocity(velocityX,velocityY); 
    let angle = Phaser.Math.RadToDeg(ball.body.velocity.angle());
    
    // a reglé (peut posé probleme a voir)
    if ((angle > 0 && angle < 105) || (angle > 255 && angle < 285)) {
        // ball.body.velocity.rotate(Phaser.Math.DegToRad(15)); // Ajuste l'angle si trop proche de la verticale
        speedBall =  ball.body.velocity.length();
        angle += Phaser.Math.DegToRad(15);


        ball.setVelocity(speedBall * Math.cos(angle) , speedBall * Math.sin(angle)); 
    }

}


function GameOver(){

    if(points[0].nbPoint >= pointsMax){
        // text + bouton rejouer
        GameOverBool = true;
        scoreTextGameOver.setVisible(true); 
    }
    else if(points[1].nbPoint >= pointsMax){
        GameOverBool = true;
        scoreTextGameOver.setVisible(true); 
    }

}

function restart(){
    
    points[0].nbPoint = 0;
    points[1].nbPoint = 0;
    start = true;
    GameOverBool = false;
    points[0].win = false;
    points[1].win = false;
    scoreTextG.setText(`score: ${points[1].nbPoint}\nMax: ${points[1].nbPointMax}`);
    scoreTextD.setText(`score: ${points[0].nbPoint}\nMax: ${points[0].nbPointMax}`);
    playerD.setPosition(config.width*.9, config.height*.5);
    playerG.setPosition(config.width*.1, config.height*.5);
    scoreTextGameOver.setVisible(false); 

    ball.setPosition(config.width*.5,config.height*.5);
    
}