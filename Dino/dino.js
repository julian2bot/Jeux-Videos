const config= {
    width:700, 
    height:300, 
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
                y: 450
            },
            debug: false

        }
    },
    backgroundColor: '#3498db'


}
// Game
var game = new Phaser.Game(config);

// parametre de jeu par default 
var speed = -300;
var speedPaysage = -50;
speedInit = speed;
var collision = false;
var popRandomArguments = {
    objet: {
        'plante': [0,70], 
        'oiseau': [71, 100]
        },
    width: 0,
    height: 0,
    sceneThis: null 
};
var objetSelect;
var scoreDino = 0;
var timePopDelay = 1100;


// sol
var bas;

// les timer Event : score / timer / plante / le temps en ms
var startTime;
var timedEvent;
var timerScore;
var timerplantes;
var timerSpeed;
var timerPaysage;
var timedEvent;
var elapsedMilliseconds;

// texte des timers et Game Over 
var timerText;
var scoreText;
var gameOverText;

// restart bouton
var reStartButton;

// fonction de chargement initial : les images => sol, plante, oiseau, dino
function preload(){

    this.load.spritesheet('dino',
        'assets/imageDino/Dino3.png',
        { frameWidth: 50, frameHeight: 40 }
    );
    this.load.image("sol","assets/imageDino/sol.png" );
    this.load.image("plante","assets/imageDino/plante.png" );
    this.load.image("oiseau","assets/imageDino/oiseau.png" );

    this.load.image("restart","assets/imageDino/restart.png" );

    // paysage
    // this.load.image("cloud","assets/imageDino/cloud.png" );
    this.load.spritesheet("cloud",
        "assets/imageDino/cloud.png",
        { frameWidth: 64, frameHeight: 64  }
    );
}

// fonction de creationd de tout les choses utile sur le jeu: sol, dino, les animations, les textes et timer, touche du clavier
function create(){
    // paysage
    paysage = this.physics.add.group({
        allowGravity: false 
    });

    // animation nuage
    this.anims.create({
        key:'cloudAnim',
        //  frames: [{key:"dino", frame: 0}],
        frames: this.anims.generateFrameNumbers("cloud", {start:0,end:3}),
        frameRate:10,
        repeat:-1
    })

    paysageFunc();

    
    // sol
    let sol = this.physics.add.staticGroup();
    sol.create(0,this.physics.world.bounds.height,"sol").setScale(2).refreshBody();
    
    // dino / joueur 
    dino = this.physics.add.sprite(100,this.physics.world.bounds.height-40,"dino")

    // animation dino
    
    this.anims.create({
        key:'left',
        frames: this.anims.generateFrameNumbers("dino", {start:1,end:5}),
        frameRate:10,
        repeat:-1
    })

    this.anims.create({
        key:'down',
        frames: [{key:"dino", frame: 2}],
        frames: this.anims.generateFrameNumbers("dino", {start:6,end:10}),
        frameRate:10,
        repeat:-1
    })

    this.anims.create({
        key:'up',
        frames: [{key:"dino", frame: 1}],
        frameRate:10,
        repeat:-1
    })
    this.anims.create({
        key:'dead',
        frames: [{key:"dino", frame: 0}],
        frameRate:10,
        repeat:-1
    })
    


    // collision avec le monde (pour securité meme si pas utile) + collision divers: sol
    dino.body.collideWorldBounds = true;
    this.physics.add.collider(dino, sol);

    
    // danger + collision divers: plante, oiseau
    plantes = this.physics.add.group({
        allowGravity: false 
    });
    this.physics.add.collider(dino, plantes, gameOver ,null,this);
    

    // text des timers + positon (haut gauche + haut droit)
    timerText = this.add.text(10, 10, 'Time: 0.0', { fontSize: '26px', fill: '#fff' });
    scoreText = this.add.text(10, 30, 'Score : 0', { fontSize: '26px', fill: '#fff' });
    scoreText.setOrigin(0,0); 
    scoreText.setPosition(this.physics.world.bounds.width - 250 , 10 );
    
    // timer 
    startTime = this.time.now;
    timedEvent = this.time.addEvent({
        delay: 100,                
        callback: updateTimer,
        callbackScope: this,
        loop: true                
    });

    // parametre utile a mettre dans popRandom mais via une fonction intermediaire puis les autres timers
    popRandomArguments.sceneThis = this;
    popRandomArguments.width= this.physics.world.bounds.width,
    popRandomArguments.height= this.physics.world.bounds.height,
    timerplantes = this.time.addEvent({
        delay: timePopDelay,        
        callback: popRandomWrapper,
        callbackScope: this,
        loop: true 
    });

    timerScore = this.time.addEvent({
        delay: 100,        
        callback: score,
        callbackScope: this,
        loop: true 
    });

    timerSpeed = this.time.addEvent({
        delay: 2000,        
        callback:speedDanger,
        callbackScope: this,
        loop: true 
    });

    timerPaysage = this.time.addEvent({
        delay: 5000,        
        callback: paysageFunc2 ,
        callbackScope: this,
        loop: true 
    });

    // touche du clavier
    cursors = this.input.keyboard.createCursorKeys();

    // bouton restart et texte Game Over
    gameOverText = this.add.text((this.physics.world.bounds.width / 2) + 55, this.physics.world.bounds.height / 2, 'Game Over', { fontSize: '26px', fill: '#fff' });
    gameOverText.setOrigin(1,1); 
    gameOverText.setVisible(false); 

    reStartButton = this.add.image(this.physics.world.bounds.width / 2, (this.physics.world.bounds.height / 2) + 30, 'restart');  // Coordonnées (x, y) et la clé de l'image
    reStartButton.setVisible(false); 
    
    reStartButton.setOrigin(1,1); 
    reStartButton.setInteractive();
    reStartButton.on('pointerdown', () => {
        reStart();
    });
}

// fonction pour chaque evenement (touche clavier par exemple)
function update(){
    // parametre par defaut du dino, il peut pas bougé sur l'axe X (juste Y soit les sauts / se baisser), l'animation de mouvement et ca taille par defaut
    dino.setVelocityX(0);
    dino.setSize(50,40);
    dino.setOrigin(0.5,0.5);

    // s'il touche une plante collision sera sur true donc on arrete tout dont les plantes donc vitese mis a zero
    // sinon on regarde les touches cliqués et reagi en consequent : deplacement, animation
    if(collision === false){
        if(cursors.up.isDown && dino.body.touching.down === true || cursors.space.isDown && dino.body.touching.down === true){
            dino.anims.play('up', true);
            dino.setVelocityY(-220);
        }
        else if(cursors.down.isDown  && dino.body.touching.down === true || cursors.shift.isDown  && dino.body.touching.down === true){
            bas = true;  
        }     
        else if(cursors.down.isDown|| cursors.shift.isDown){
            dino.setVelocityY(120);
        }
        if(bas === true && cursors.down.isUp && cursors.shift.isUp && dino.body.touching.down === true ){
            bas = false;
            dino.setPosition(dino.x, dino.y-20);
            dino.anims.play('left', true);
        }
        else if (cursors.down.isUp && cursors.shift.isUp && cursors.up.isUp && cursors.space.isUp && dino.body.touching.down === true){
            dino.anims.play('left', true);
        }

        plantes.setVelocityX(speed);
        if(bas === true){
            dino.anims.play('down', true);
            dino.setOrigin(0.5,0.75);
            dino.setSize(50,20);
        }
    }
    else if(collision === true){
        plantes.setVelocityX(0 );
        paysage.setVelocityX(0);

        if(cursors.space.isDown && cursors.shift.isDown){
            collision = false;
            reStart();                
        }
    }
}

// fonction intermediaire qui appel popRanom avec les parametres de popRandomArguments
function popRandomWrapper(){
    popRandom(popRandomArguments.objet, popRandomArguments.width,popRandomArguments.height, popRandomArguments.sceneThis)
}

// popRandom est une foncton qui sert a faire apparaitre une plante ou un oiseau aleatoire sur la carte par rapport a la probabilitée qu'il ai d'apparaitre 
function popRandom(objet, width,height, sceneThis){ 

    randomlol = Math.random()*100;

    Object.keys(objet).forEach(nomObjet => {
        let min = popRandomArguments.objet[nomObjet][0];
        let max = popRandomArguments.objet[nomObjet][1];
        let nombreRandom = Math.trunc(randomlol);

        if(nombreRandom >= min && nombreRandom <= max){
            objetSelect = nomObjet;
        }
    });

    // fait apparaitre objet voulu sur le jeu puis se deplace jusqu'au joueur et s'auto detruit apres 7 sec (soit une fois passé le joueur meme avec une vitesse lent)
    // sauf si collision est vrai (Game Over activé) les plantes / oiseaux se detruisent pas pour les laisser sur la page de fin 
    if(objetSelect === "plante"){
        let nb_plante = Math.trunc(Math.random()*4);
        let taille = 0;
        
        for (let index = 0; index <= nb_plante; index++) {
            
            let plante = plantes.create(width-10 + taille,height-35, objetSelect);
            taille += plante.displayWidth;

            sceneThis.time.delayedCall(7000, function() {
                if(collision === false){
                    plante.destroy();
                }            
            }, [], sceneThis);            
        }
    }
    else if(objetSelect === "oiseau"){
        let plante = plantes.create(width-10,height-65, objetSelect);
        
        sceneThis.time.delayedCall(7000, function() {
            if(collision === false){
                plante.destroy(); 
            }
        }, [], sceneThis);
    }
}

// Paysage
function paysageFunc(){

    for (let index = 0; index < 5; index++) {
        let randomX = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        let randomY = Math.floor(Math.random() * 700);
    
        paysage2 = paysage.create(randomY,randomX,'cloud');
        paysage2.anims.play('cloudAnim', true);
        paysage2.setVelocityX(speedPaysage);
    }
}

function paysageFunc2(){
    for (let index = 0; index < 5; index++) {
        let randomX = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        let randomY = Math.floor(Math.random() * 700 );
    
        paysage2 = paysage.create(randomY+700,randomX,'cloud');
        paysage2.anims.play('cloudAnim', true);
        paysage2.setVelocityX(speedPaysage);
    }
}

// fonction qui sert a afficher le timer avec le bon temps en miliseconde
function updateTimer() {
    // elapsedMilliseconds = this.time.now + startTime - startTime;
    elapsedMilliseconds = this.time.now + startTime - startTime;
    // var elapsedSeconds = (elapsedMilliseconds / 1000).toFixed(1);
    timerText.setText('Time: ' + elapsedMilliseconds.toFixed(1));
}    

// fonction qui sert a afficher le score du joueur en incrementant de 1 a chaque appel
function score(){
    scoreDino+=1;
    scoreText.setText('score : ' + scoreDino);
}

// fonction qui sert a augmenté la vitesse des plantes / oiseaux
function speedDanger(){
    if(speed > -1000){
        speed -= 50;
    }
    console.log(speed);
    if(collision === false){
        plantes.setVelocityX(speed);
    }
}

// FIN DU JEU

// fonction qui stop le timer general 
function stopTimer() {
    if (timedEvent) {
        timedEvent.remove(); 
    }
}

// fonction qui stop le timer de score
function stopScore(){
    if (timerScore) {
        timerScore.reset(); 
    }
}

// fonction qui stop le timer de plante
function stopPlante(){
    if (timerplantes) {
        timerplantes.remove(); 
    }
}

// // fonction qui stop le timer de vitesse
function speedStop(){
    if (timerSpeed) {
        timerSpeed.remove(); 
    }
}


// fonction game over qui mets les parametres de collision a vrai pour arreté tout ainsi que stop les animations et timers
function gameOver(dino, plantes){
    
    dino.anims.play('dead', true); // => a regler

    if(bas === true){dino.setPosition(dino.x, dino.y-20);}

    collision = true;
    this.physics.world.paused = true;
    this.anims.pauseAll(); 
    stopTimer();
    stopScore();
    stopPlante();
    speedStop();
    reStartButton.setVisible(true); 
    gameOverText.setVisible(true);
}

// RELANCER JEU

function lanceTimer() {
    if (timedEvent) {
        timedEvent.remove();
    }

    timedEvent = popRandomArguments.sceneThis.time.addEvent({
        delay: 100,                
        callback: updateTimer,
        callbackScope: popRandomArguments.sceneThis,
        loop: true                
    });
}

// fonction qui lance le timer de score
function lanceScore(){
    if (timerScore) {
        timerScore.remove();
    }
    timerScore = popRandomArguments.sceneThis.time.addEvent({
        delay: 100,        
        callback: score,
        callbackScope: popRandomArguments.sceneThis,
        loop: true 
    })
}

// fonction qui lance le timer de plante
function lancePlante(){
    if (timerplantes) {
        timerplantes.remove();
    }
    timerplantes = popRandomArguments.sceneThis.time.addEvent({
        delay: timePopDelay,        
        callback: popRandomWrapper,
        callbackScope: popRandomArguments.sceneThis,
        loop: true 
    })
}

// // fonction qui lance le timer de vitesse
function lanceSpeed(){
    if (timerSpeed) {
        timerSpeed.remove();
    }
    timerSpeed = popRandomArguments.sceneThis.time.addEvent({
        delay: 2000,        
        callback:speedDanger,
        callbackScope: popRandomArguments.sceneThis,
        loop: true 
    })
}


// fonction qui remets tout les parametres par defaut et relance le jeu
function reStart(){
    plantes.clear(true);
    lanceTimer();
    lanceScore();
    lancePlante();
    lanceSpeed();
    // game = new Phaser.Game(config);
    // this.physics.world.paused = false;
    popRandomArguments.sceneThis.anims.resumeAll(); 
    collision = false;          
    scoreDino = 0;
    speed = speedInit;
    timePopDelay = 1100;
    reStartButton.setVisible(false); 
    gameOverText.setVisible(false); 
    paysage.setVelocityX(speedPaysage);
}