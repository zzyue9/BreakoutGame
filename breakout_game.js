// 初始化游戏实例，设置游戏窗口大小为480x320，使用自动缩放模式
var game = new Phaser.Game(480, 320, Phaser.AUTO, null, {
    preload: preload, 
    create: create,   
    update: update    
});

// 定义变量
var ball; // 球
var paddle; // 挡板
var bricks; // 砖块
var newBrick; // 新砖块
var brickInfo; // 砖块的信息
var scoreText; // 分数文本
var score = 0; // 当前分数
var lives = 3; // 剩余生命的值
var livesText; // 生命值的文本内容
var lifeLostText; // 减少生命值后提示的文本
var playing = false; // 游戏是否正在进行的标志
var startButton; // 开始游戏的按钮

// 加载游戏资源
function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // 设置缩放模式为显示全部内容
    game.scale.pageAlignHorizontally = true; // 水平居中
    game.scale.pageAlignVertically = true; // 垂直居中
    game.stage.backgroundColor = '#eee'; // 设置背景颜色
    game.load.image('paddle', 'img/paddle.png'); // 加载挡板图片
    game.load.image('brick', 'img/brick.png'); // 加载砖块图片
    game.load.spritesheet('ball', 'img/wobble.png', 20, 20); // 加载球的图片
    game.load.spritesheet('button', 'img/button.png', 120, 40); // 加载按钮的图片
}

// 创建游戏元素
function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE); 
    game.physics.arcade.checkCollision.down = false; // 物体与地面碰撞的检测
    // 创建球
    ball = game.add.sprite(game.world.width*0.5, game.world.height-25, 'ball');
    ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
    ball.anchor.set(0.5);
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true; // 当球碰到边界时，触发碰撞
    ball.body.bounce.set(1); // 设置反弹系数为1
    ball.checkWorldBounds = true; // 启用边界检查
    ball.events.onOutOfBounds.add(ballLeaveScreen, this); // 当球超出边界时调用ballLeaveScreen函数

    // 创建挡板并设置属性
    paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
    paddle.anchor.set(0.5,1);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.immovable = true;// 设置挡板为不可移动

    // 初始化砖块
    initBricks();

    // 创建分数和生命值的文本内容
    textStyle = { font: '18px Arial', fill: '#0095DD' };
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);
    livesText.anchor.set(1,0);
    lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, tap to continue', textStyle);
    lifeLostText.anchor.set(0.5);
    lifeLostText.visible = false;

    //创建开始游戏的按钮
    startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);
    startButton.anchor.set(0.5);
}

// 游戏的主循环，处理碰撞
function update() {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle); // 处理球与挡板的碰撞
    game.physics.arcade.collide(ball, bricks, ballHitBrick); // 处理球与砖块的碰撞
    if(playing) { // 如果游戏正在进行
        paddle.x = game.input.x || game.world.width*0.5; // 移动挡板跟随玩家输入或居中
    }
}


// 初始化砖块
function initBricks() {
    brickInfo = {
        width: 50, // 砖块的宽度
        height: 20, // 砖块的高度
        count: {
            row: 7, // 砖块的行数
            col: 3  // 砖块的列数
        },
        offset: {
            top: 50, // 砖块顶部偏移量
            left: 60 // 砖块左侧偏移量
        },
        padding: 10 // 砖块之间的间距
    }
    bricks = game.add.group(); // 创建一个砖块组
    for(c=0; c<brickInfo.count.col; c++) { // 遍历列
        for(r=0; r<brickInfo.count.row; r++) { // 遍历行
            var brickX = (r*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left; // 计算砖块X坐标
            var brickY = (c*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top; // 计算砖块Y坐标
            newBrick = game.add.sprite(brickX, brickY, 'brick'); // 创建砖块
            game.physics.enable(newBrick, Phaser.Physics.ARCADE); 
            newBrick.body.immovable = true; // 设置砖块为不可移动
            newBrick.anchor.set(0.5); // 设置中心
            bricks.add(newBrick); // 将砖块添加到砖块组中
        }
    }
}

// 处理球与砖块的碰撞
function ballHitBrick(ball, brick) {
    var killTween = game.add.tween(brick.scale); // 创建一个动画来缩小砖块
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None); // 200毫秒内将砖块缩放到0
    killTween.onComplete.addOnce(function(){
        brick.kill(); // 动画完成后销毁砖块
    }, this);
    killTween.start();
    score += 10; // 增加分数
    scoreText.setText('Points: '+score); // 更新分数文本
    if(score === brickInfo.count.row*brickInfo.count.col*10) { // 如果分数达到总分
        alert('You won the game, congratulations!'); // 提示胜利
        location.reload(); // 重新加载页面
    }
}


// 处理球离开屏幕的情况
function ballLeaveScreen() {
    lives--; // 减少生命值
    if(lives) { // 如果生命值不为0
        livesText.setText('Lives: '+lives); // 更新生命值文本
        lifeLostText.visible = true; // 显示生命值丢失提示文本
        ball.reset(game.world.width*0.5, game.world.height-25); // 重置球的位置
        paddle.reset(game.world.width*0.5, game.world.height-5); // 重置挡板的位置
        game.input.onDown.addOnce(function(){ // 监听点击事件
            lifeLostText.visible = false; // 隐藏生命值丢失提示文本
            ball.body.velocity.set(150, -150); // 重新设置球的速度
        }, this);
    }
    else { // 如果生命值耗尽
        alert('You lost, game over!'); // 提示游戏结束
        location.reload(); // 重新加载页面
    }
}

// 处理球与挡板的碰撞
function ballHitPaddle(ball, paddle) {
    ball.animations.play('wobble'); // 播放球的动画
    ball.body.velocity.x = -1*5*(paddle.x-ball.x); // 根据挡板与球的位置差计算球的X方向速度
}

function startGame() {
    startButton.destroy();
    ball.body.velocity.set(150, -150);
    playing = true;
}