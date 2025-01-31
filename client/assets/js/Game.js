PhaserGame.Game = function(){};
PhaserGame.Game.prototype = {
  preload: function() {
    this.game.time.advancedTiming = true;
    this.GAME_OVER = false;
    this.PLAYER_VISIBILE = true;
    this.MAX_PROJECTILES = 20;
    this.SHOT_DELAY = 300;
    this.NUMBER_OF_BULLETS = 10;
    this.points = 0;
  },
  create: function() {
    var playerId = this.cache.getJSON('game_data').player;
    var weaponId = this.cache.getJSON('game_data').weapon;
    this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'space');
    this.background.autoScroll(-20, 0);

    //move player with cursor keys
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.Spacebar = this.game.input.keyboard.addKey(32);
    this.Spacebar.onDown.add(this.shoot, this);

    //Turn on impact events for the world, without this we get no collision callbacks
    this.game.physics.p2.setImpactEvents(true);
    this.game.physics.p2.restitution = 0.8;
    
    this.healthbar = this.game.add.sprite(this.game.width-400-10,10,'healthbar');
    this.healthbar.cropEnabled = true;

    //  Create our collision groups. One for the player, one for the enemies
    this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.enemyCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.obstacleCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.projectileCollisionGroup = this.game.physics.p2.createCollisionGroup();
    this.weaponCollisionGroup = this.game.physics.p2.createCollisionGroup();

    this.createPlayer(playerId, weaponId);
    //this.generateObstacles();
    this.generateEnemies();
    this.generateProjectiles();

    var t1 = this.game.add.text(10, 20, "Points:", { font: "20px Arial", fill: "#ff0"});
    t1.fixedToCamera = true;
    this.pointsText = this.game.add.text(80, 18, "-", { font: "26px Arial", fill: "#00ff00"});
    this.pointsText.fixedToCamera = true;
    
  },
  createPlayer: function(playerId, weaponId) {
    this.playerData = this.cache.getJSON('game_data')[playerId];
    this.weaponData = this.cache.getJSON('game_data')[weaponId];
    this.currentWeapon = weaponId;
    var w = this.playerData.width,
        x = w,
        y = this.game.height/2;
    if (this.GAME_OVER) {
      this.player.destroy();
    } else if (typeof this.player !== 'undefined') {
      x = this.player.body.x || w;
      y = this.player.body.y || this.game.height/2;
      this.player.destroy();
    }
    this.player = this.game.add.sprite(x, y, playerId);
    //this.game.physics.arcade.enable(this.player);
    this.game.physics.p2.enable(this.player);
    this.player.body.clearShapes();
    this.player.body.loadPolygon('physics_data', playerId);
    //this.player.body.sprite.alpha = 0.5;
    this.player.anchor.setTo(0.5, 0.5);
    this.player.body.setCollisionGroup(this.playerCollisionGroup);
    this.player.body.collides([this.obstacleCollisionGroup], this.playerHit, this);
    this.player.body.collides([this.enemyCollisionGroup], this.playerHit, this);
    this.player.body.collides([this.projectileCollisionGroup], this.playerHit, this);
    //this.player.body.setZeroDamping();
    this.player.body.fixedRotation = true;
    this.game.world.bringToTop(this.player);
    this.PLAYER_VISIBILE = true;
    this.points = 0;
    this.shield = this.playerData.shield;
    this.reduceTo = this.shield
    var barWidth = 400;
    var barHeight = 30;
    var cropRect = new Phaser.Rectangle(0, 0, barWidth, barHeight);
    this.healthbar.crop(cropRect);
  },
  generateObstacles: function(){
    this.obstacles = this.game.add.group();
    //enable physics in them
    this.obstacles.enableBody = true;
    this.obstacles.physicsBodyType = Phaser.Physics.P2JS;
  },
  generateEnemies: function() {
    var num1 = this.game.rnd.integerInRange(2, 4);
    var num2 = this.game.rnd.integerInRange(0, 2);
    var enemy1, enemy2;
    var enemy1Data = this.cache.getJSON('game_data').enemy1;
    var enemy2Data = this.cache.getJSON('game_data').enemy2;
    var x, y, i;

    this.enemies = this.game.add.group();
    //enable physics in them
    this.enemies.enableBody = true;
    this.enemies.physicsBodyType = Phaser.Physics.P2JS;
    
    for (i = 0; i < num1; i++) {
      x = (this.game.width) + this.game.rnd.integerInRange(0, this.game.width);
      y = this.game.rnd.integerInRange(0, this.game.height-enemy1Data.height);
      enemy1 = this.enemies.create(x, y, 'enemy1');
      enemy1.body.clearShapes();
      enemy1.body.setZeroDamping();
      enemy1.body.fixedRotation = true;
      enemy1.body.loadPolygon('physics_data', 'enemy1');
      enemy1.body.setCollisionGroup(this.enemyCollisionGroup);
      enemy1.body.collides([this.playerCollisionGroup], this.playerHit, this);
      //enemy1.body.collides([this.obstacleCollisionGroup], this.enemiesCollide, this);
      enemy1.body.collides([this.enemyCollisionGroup], this.enemiesCollide, this);
      enemy1.body.collides([this.weaponCollisionGroup], this.enemyHit, this);
      enemy1.body.velocity.x = parseInt('-'+enemy1Data.velocity);
    }
    for (i = 0; i < num2; i++) {
      x = (this.game.width) + this.game.rnd.integerInRange(0, this.game.width);
      y = this.game.rnd.integerInRange(0, this.game.height-enemy2Data.height);
      enemy2 = this.enemies.create(x, y, 'enemy2');
      enemy2.body.clearShapes();
      enemy2.body.setZeroDamping();
      enemy2.body.fixedRotation = true;
      enemy2.body.loadPolygon('physics_data', 'enemy2');
      enemy2.body.setCollisionGroup(this.enemyCollisionGroup);
      enemy2.body.collides([this.playerCollisionGroup], this.playerHit, this);
      //enemy2.body.collides([this.obstacleCollisionGroup], this.enemiesCollide, this);
      enemy2.body.collides([this.enemyCollisionGroup], this.enemiesCollide, this);
      enemy2.body.collides([this.weaponCollisionGroup], this.enemyHit, this);
      enemy2.body.velocity.x = parseInt('-'+enemy2Data.velocity);
    }
  },
  generateProjectiles: function() {
    var bullet, missile1, i;
    this.my_bullets = this.game.add.group();
    this.missile1 = this.game.add.group();
    this.explosions = this.game.add.group();
    
    for(i = 0; i < this.NUMBER_OF_BULLETS; i++) {
      bullet = this.game.add.sprite(0, 0, this.currentWeapon);
      this.my_bullets.add(bullet);
      bullet.anchor.setTo(0.5, 0.5);
      this.game.physics.p2.enable(bullet);
      bullet.body.setCollisionGroup(this.weaponCollisionGroup);
      bullet.body.collides([this.enemyCollisionGroup], this.enemyHit, this);
      bullet.kill();
    }
    for(i = 0; i < this.NUMBER_OF_BULLETS; i++) {
      missile1 = this.game.add.sprite(0, 0, 'missile1');
      this.missile1.add(missile1);
      missile1.anchor.setTo(0.5, 0.5);
      this.game.physics.p2.enable(missile1);
      missile1.body.setCollisionGroup(this.projectileCollisionGroup);
      missile1.body.collides([this.playerCollisionGroup], this.playerHit, this);
      missile1.kill();
    }
  },
  shoot: function(){
    if (this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
    if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
    this.lastBulletShotAt = this.game.time.now;
    var bullet = this.my_bullets.getFirstDead();
    if (bullet === null || bullet === undefined) return;
    bullet.revive();
    bullet.body.angle = 0;
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    // Set the bullet position to the player position.
    bullet.reset(this.player.body.x+20, this.player.body.y);
    bullet.body.velocity.x = this.weaponData.velocity;
  },
  enemyShoot: function(enemy, enemyData) {
    var bullet = this[enemyData.weapon].getFirstDead();
    if (bullet === null || bullet === undefined) return;
    bullet.revive();
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;
    // Set the bullet position to the enemy position.
    bullet.reset(enemy.body.x, enemy.body.y);
    bullet.body.velocity.x = parseInt('-' + this.cache.getJSON('game_data')[enemyData.weapon].velocity);
  },
  playerHit: function(body1, body2) {
    if (body1.sprite.key.indexOf('fighter') !== -1 || body2.sprite.key.indexOf('fighter') !== -1) {
      var obstacle = (body1.sprite.key.indexOf('fighter') !== -1 ? body2.sprite : body1.sprite);
      var obstacleData = this.cache.getJSON('game_data')[obstacle.key];
      this.player.body.velocity.x = 0;
      this.player.body.velocity.y = 0;
      
      if (this.PLAYER_VISIBILE && Math.min(this.reduceTo, this.shield) > 0) {
        this.reduceTo = Math.min(this.reduceTo, this.shield)-obstacleData.damage;
      }
      if (Math.min(this.reduceTo, this.shield) <= 0) {
        this.playerDied('You were killed by ' + obstacle.key);
      }
      obstacle.kill();
    }
  },
  enemyHit: function(body1, body2) {
    var weapon, enemy;
    if (body1.sprite.key === this.currentWeapon) {
      weapon = body1.sprite;
      enemy = body2.sprite;
    } else {
      weapon = body2.sprite;
      enemy = body1.sprite;
    }
    if (!weapon || !enemy) {
      return;
    }
    var enemyData = this.cache.getJSON('game_data')[enemy.key];
    
    this.points += enemyData.worth;
    this.pointsText.text = this.points;
    enemy.destroy();
    weapon.kill();
  },
  enemiesCollide: function(body1, body2) {
    if (body1.sprite.key.indexOf('fighter') !== -1 || body2.sprite.key.indexOf('fighter') !== -1) {
      return;
    }
    body1.sprite.body.velocity.x = 0;
    body1.sprite.body.velocity.y = 0;
    body2.sprite.body.velocity.x = 0;
    body2.sprite.body.velocity.y = 0;
  },
  playerDied: function(txt) {
    this.GAME_OVER = true;
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;
    this.gameOverLabel = this.game.add.text(this.game.width / 2 , this.game.height / 2, txt + "\n Your Score: " + this.points,
      { font: '24px Lucida Console', fill: '#fff', align: 'center'});
    this.gameOverLabel.anchor.setTo(0.5, 0.5);
    //this.restartButton = this.game.add.button(this.game.world.centerX - 95, this.game.world.centerY - 150, 'button', this.restart, this);
    //this.restartButton.onInputUp.add(this.restart, this);
    if (this.points > this.highestScore) {
      store('highScore', this.points);
    }
  },
  playerMove: function() {
    var w = this.playerData.width/2;
    var h = this.playerData.height/2;
    var xBound = [w,this.game.width-w];
    var yBound = [h,this.game.height-h];
    var isMoving = !(Phaser.Point.equals(this.player.body.velocity,new Phaser.Point(0,0)));
    var isOOBU = this.player.body.y <= yBound[0];
    var isOOBR = this.player.body.x >= xBound[1];
    var isOOBD = this.player.body.y >= yBound[1];
    var isOOBL = this.player.body.x <= xBound[0];
    var isOOB = (isOOBU || isOOBR || isOOBD || isOOBL);
    var x = 0, y = 0;
    
    if (isMoving && isOOB) {
      this.player.body.setZeroVelocity();
    }
    if (this.cursors.right.isDown && (isOOBL || !isOOBR)) {
      x = this.playerData.move;
    } else if (this.cursors.left.isDown && (isOOBR || !isOOBL)) {
      x = parseInt('-' + this.playerData.move);
    }
    if (this.cursors.up.isDown && (isOOBD || !isOOBU)) {
      y = parseInt('-' + this.playerData.move);
    } else if (this.cursors.down.isDown && (isOOBU || !isOOBD)) {
      y = this.playerData.move;
    }
    if (x !== 0 || y !== 0) {
      this.player.body.velocity.x = x;
      this.player.body.velocity.y = y;
    }
  },
  enemyMove: function(enemy, enemyData) {
    var isMoving = !(Phaser.Point.equals(enemy.body.velocity,new Phaser.Point(0,0)));
    var isOOBU = enemy.body.y <= enemyData.height/2;
    var isOOBD = enemy.body.y >= (this.game.height-enemyData.height/2);
    var isOOBL = enemy.body.x <= enemyData.width/2;
    var isOOB = (isOOBU || isOOBD || isOOBL);
    var x = 0, y = 0;
    
    if (isMoving && isOOB) {
      enemy.body.setZeroVelocity();
    }
    if (isOOBL) {
      enemy.destroy();
      return;
    } else if ((!isOOB || (!isMoving && isOOB)) && (!isMoving || this.game.rnd.integerInRange(0, 1000) >= 995)) {
      var xx = [0, parseInt('-'+Math.min(enemyData.velocity, this.game.rnd.integerInRange(0, enemyData.velocity)))];
      var yy = [parseInt('-'+Math.min(enemyData.velocity, this.game.rnd.integerInRange(0, enemyData.velocity))), 0, Math.min(enemyData.velocity, this.game.rnd.integerInRange(0, enemyData.velocity))];
      x = xx[this.game.rnd.integerInRange(0, 1)];
      y = yy[this.game.rnd.integerInRange(0, 2)];
    }
    if (enemy.body.velocity.x > enemyData.velocity) {
      enemy.body.velocity.x = enemyData.velocity;
    } else if (enemy.body.velocity.y > enemyData.velocity) {
      enemy.body.velocity.y = enemyData.velocity;
    }
    
    if (x !== 0 || y !== 0) {
      enemy.body.velocity.x = x;
      enemy.body.velocity.y = y;
    }
  },
  update: function() {
    if (this.GAME_OVER) {
      return;
    }
    if (this.shield <= 0) {
      this.GAME_OVER = true;
      this.player.body.velocity.x = 0;
      this.player.body.velocity.y = 0;
      this.playerDied('shield depleated');
      return;
    }
    var that = this;
    this.playerMove();

    var shieldValue = Math.max(this.shield, this.reduceTo),
        maxHealth = this.playerData.shield,
        diff = (--shieldValue)/maxHealth,
        barWidth = 400,
        barHeight = 30,
        barRemaining = (barWidth - (barWidth - (barWidth * diff))).toFixed(0),
        cropRect = new Phaser.Rectangle(0, 0, barRemaining, barHeight);

    if (shieldValue >= this.reduceTo) {
      this.shield = shieldValue;
      this.healthbar.crop(cropRect);
    }
    this.enemies.filter(function(v) { return v.body.x < -70; }).callAll('destroy');
    this.enemies.forEachAlive(function(enemy) {
      var enemyData = that.cache.getJSON('game_data')[enemy.key];
      that.enemyMove(enemy, enemyData);
      var shoot = that.game.rnd.integerInRange(0, 1000) >= 995;
      if (shoot) {
        that.enemyShoot(enemy, enemyData);
      }
    });
    this.missile1.forEachAlive(function(missile) {
      missile.body.velocity.x = parseInt('-' + that.cache.getJSON('game_data')[missile.key].velocity);
    });
    var enemyId = this.cache.getJSON('game_data').enemies[this.game.rnd.integerInRange(0, this.cache.getJSON('game_data').enemies.length - 1)];
    var enemyData = this.cache.getJSON('game_data')[enemyId];
    var spawn = this.game.rnd.integerInRange(0, 1000) >= 995;
    if (spawn) {
      var x = (this.game.width);// + this.game.rnd.integerInRange(0, this.game.width);
      var y = this.game.rnd.integerInRange(0, this.game.height-enemyData.height);
      var enemy = this.enemies.create(x, y, enemyId);
      enemy.body.clearShapes();
      enemy.body.setZeroDamping();
      enemy.body.fixedRotation = true;
      enemy.body.loadPolygon('physics_data', enemyId);
      enemy.body.setCollisionGroup(this.enemyCollisionGroup);
      enemy.body.collides([this.playerCollisionGroup], this.playerHit, this);
      //enemy.body.collides([this.obstacleCollisionGroup], this.enemiesCollide, this);
      enemy.body.collides([this.enemyCollisionGroup], this.enemiesCollide, this);
      enemy.body.collides([this.weaponCollisionGroup], this.enemyHit, this);
      enemy.body.velocity.x = parseInt('-'+enemyData.velocity);
    }
  },
  render: function() {
    this.game.debug.text(this.game.time.fps || '--', 20, 70, "#00ff00", "40px Courier");  
  }
};