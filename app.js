const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

class Tile {
    constructor () {
        this.surface = Math.random() > 0.5 ? 'sand' : 'snow';
        this.building = null;
        this.party = null;
    };
}

class Map {
    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width).fill(null).map(()=>new Array(height).fill(null).map(()=>new Tile));
    };
    getPath (prevX, prevY, targetX, targetY) {
        let points = [];
        let x = prevX;
        let y = prevY;
        const costPerTile = 20;
        let cost;
        do {
            cost = 0;
            if (x < targetX) {
                x++;
                cost += costPerTile;
            } else if (x > targetX) {
                x--;
                cost += costPerTile;
            }
            if (y < targetY) {
                y++;
                cost = cost !== 0 ? parseFloat(Math.sqrt(2 * Math.pow(costPerTile, 2)).toFixed(3)) : costPerTile;
            } else if (y > targetY) {
                y--;
                cost = cost !== 0 ? parseFloat(Math.sqrt(2 * Math.pow(costPerTile, 2)).toFixed(3)) : costPerTile;
            }
            points.push ({x, y, cost});
        } while (x !== targetX || y !== targetY);
        game.draw()
        // return points.reduce((a,b)=>{return a.cost !== undefined ? a.cost + b.cost : a + b.cost});
        return points;
    }
    moveParty (party, path) {
        let nextStep = path[0];
        this.stop = false;
        let i = 0;
        console.log('this', this);
        canvas.removeEventListener('click', this.gameMapClickHandle);
        canvas.addEventListener('click', this.gameMapClickWhileMovingHandle);

        const moveInterval = setInterval(()=>{
            nextStep = path[i];
            if (typeof nextStep === 'undefined' || party.currentMovePoints > nextStep.cost || this.stop === true) {
                clearInterval(moveInterval);
                this.stop = false;
                canvas.removeEventListener('click', this.gameMapClickWhileMovingHandle, true);
                canvas.addEventListener('click', this.gameMapClickHandle);
                return;
            }
            this.tiles[party.x][party.y].party = null;
            party.x = nextStep.x;
            party.y = nextStep.y;
            this.tiles[party.x][party.y].party = party;
            party.movePoints -= nextStep.cost;
            i++;
            nextStep = path[i];
            game.draw();
        }, 150);
    }

}

class Camera {
    constructor (settings) {
        this.x = 0;
        this.y = 0;
    }
}

class Player {
    constructor (settings) {
        this.name = settings.name;
        this.color = settings.color;
        this.parties = [];
        this.towns = [];
        this.buildings = [];
    }
}

class Party {
    constructor (settings) {
        this.name = settings.name;
        this.x = settings.x;
        this.y = settings.y;
        this.path = null;
        this.maxMovePoints = settings.maxMovePoints;
        this.movePoints = this.maxMovePoints;
    }
}

class Game {
    constructor (settings) {
        this.gameWidth = settings.gameWidth;
        this.gameHeight = settings.gameHeight;
        this.mapWidth = settings.mapWidth;
        this.mapHeight = settings.mapHeight;
        this.tileSide = settings.tileSide;

        this.map = new Map(this.mapWidth, this.mapHeight);
        this.camera = new Camera();
        this.players = [];

        canvas.setAttribute('width', this.gameWidth);
        canvas.setAttribute('height', this.gameHeight);
        this.currentParty;
    };

    draw () {
        ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        for (let x = this.camera.x; x < this.camera.x + Math.floor(this.gameWidth / this.tileSide); x++) {
            for (let y = this.camera.y; y < this.camera.y + Math.floor(this.gameHeight / this.tileSide); y++) {
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                if (this.map.tiles[x][y].surface === 'sand') {
                    ctx.fillStyle= 'yellow';
                }
                else {
                    ctx.fillStyle= 'black';
                }
                    ctx.rect((x - this.camera.x) * this.tileSide, (y - this.camera.y) * this.tileSide, this.tileSide, this.tileSide);
                    ctx.fill();
                    ctx.stroke();
                if (this.map.tiles[x][y].party !== null) {
                    ctx.beginPath();
                    ctx.fillStyle= 'red';
                    ctx.arc((x - this.camera.x) * this.tileSide + Math.floor(this.tileSide / 2), (y - this.camera.y) * this.tileSide + Math.floor(this.tileSide / 2), Math.floor(this.tileSide / 2), 0, 2*Math.PI);
                    ctx.fill();
                }

            }
        }
        if (this.currentParty !== null && this.currentParty.path !== null) {
            ctx.fillStyle= 'lime';
            this.currentParty.path.forEach((point) => {
                ctx.beginPath();
                ctx.arc((point.x - this.camera.x) * this.tileSide + Math.floor(this.tileSide / 2), (point.y - this.camera.y) * this.tileSide + Math.floor(this.tileSide / 2), Math.floor(this.tileSide / 2), 0, 2*Math.PI);
                ctx.fill()
            });
            ctx.fill()
        }
    }

    gameMapArrowHandle (event) {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (this.camera.y > 0) {
                    this.camera.y--;
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (this.camera.y < this.mapHeight - Math.floor(this.gameHeight / this.tileSide)) {
                    this.camera.y++;
                }
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (this.camera.x > 0) {
                    this.camera.x--;
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (this.camera.x < this.mapWidth - Math.floor(this.gameWidth / this.tileSide)) {
                    this.camera.x++;
                }
                break;
            default:
                return;
        }
        this.draw();
    }

    gameMapClickHandle (event) {
        let x = this.camera.x + Math.floor(event.offsetX / game.tileSide);
        let y = this.camera.y + Math.floor(event.offsetY / game.tileSide);

        let previousX = this.currentParty.x;
        let previousY = this.currentParty.y;

        if (this.currentParty.path === null) {
            this.currentParty.path = this.map.getPath(previousX, previousY, x, y);
        }
        else if (this.currentParty.path[this.currentParty.path.length-1].x === x && this.currentParty.path[this.currentParty.path.length-1].y === y){
            this.map.moveParty(this.currentParty, this.currentParty.path)
            this.currentParty.path = null;
            /*
            this.map.tiles[previousX][previousY].party = null;
            this.map.tiles[x][y].party = this.currentParty;
            this.players[0].parties[0].x = x;
            this.players[0].parties[0].y = y;
            let step = 0;*/
            /*const interval = setInterval (()=>{
                this.players[0].parties[0].x = this.currentParty.path[step].x;
                this.players[0].parties[0].y = this.currentParty.path[step].y;
                this.map.tiles[previousX][previousY].party = null;
                this.map.tiles[x][y].party = this.currentParty;
                step++;
                if (step >= this.currentParty.path.length - 1) {
                    clearInterval(interval);
                }
            },200);*/
        }
        else {
            this.currentParty.path = this.map.getPath(previousX, previousY, x, y);
        }


        this.draw();
    }

    gameMapClickWhileMovingHandle (event) {
        console.log('ololo');
        this.stop = true;
    }
}


const game = new Game({
    gameWidth: 1200,
    gameHeight: 800,
    mapWidth: 80,
    mapHeight: 60,
    tileSide: 50
});

game.players.push(new Player({
    name: 'Pawel',
    color: 'purple'
}));

game.players[0].parties.push(new Party({
    name: 'Kurwa',
    x: 3,
    y: 5,
    maxMovePoints: 200
}));

game.currentParty = game.players[0].parties[0];
game.map.tiles[3][5].party = (game.players[0].parties[0]);

game.draw();

document.addEventListener('DOMContentLoaded', ()=> {
    window.addEventListener('keydown', game.gameMapArrowHandle.bind(game));

    canvas.addEventListener('click', game.gameMapClickHandle.bind(game));
});
