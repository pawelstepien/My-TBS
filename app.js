const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('interface');

class Tile {
    constructor () {
        this.surface = Math.random() > 0.6 ? 'sand' : 'snow';
        this.building = null;
        this.party = null;
        this.cost = this.surface === 'sand' ? 200 : 50;
    };
}

class Map {
    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width).fill(null).map(()=>new Array(height).fill(null).map(()=>new Tile));
        this.moveInterval = null;
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
        return points;
    }
    moveParty (party, path) {
        this.moveInterval = setInterval(()=>{
            if (path.length > 0 && party.movePoints >= path[0].cost) {
                this.tiles[party.x][party.y].party = null;
                party.x = path[0].x;
                party.y = path[0].y;
                this.tiles[party.x][party.y].party = party;
                party.movePoints -= path[0].cost;
                path.shift();
                console.log(party.movePoints);
                if (game.camera.follow) {
                    game.camera.center(party.x, party.y);
                }
                game.draw();
                return;
            } else {
                console.log('clearing this shit');
                clearInterval(this.moveInterval);
                this.moveInterval = null;
            }
            game.draw();
        }, 150);
    }

    getGraph (startX, startY, finishX, finishY) {
        console.log(this);
        const graph = {};
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let xModifier;
                let yModifier;
                let propertyName;
                let node = {};
                //All map tiles
                //North
                if (y > 0) {
                    xModifier = 0;
                    yModifier = -1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer ? Infinity : this.tiles[x + xModifier][y + yModifier].cost;
                }
                //North east
                if (y > 0 && x < this.width - 1) {
                    xModifier = 1;
                    yModifier = -1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : parseFloat(Math.sqrt(2 * Math.pow(this.tiles[x + xModifier][y + yModifier].cost, 2)).toFixed(3));
                }
                //East
                if (x < this.width - 1) {
                    xModifier = 1;
                    yModifier = 0;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : this.tiles[x + xModifier][y + yModifier].cost;
                }
                //South east
                if (y < this.height - 1 && x < this.width - 1) {
                    xModifier = 1;
                    yModifier = 1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : parseFloat(Math.sqrt(2 * Math.pow(this.tiles[x + xModifier][y + yModifier].cost, 2)).toFixed(3));
                }
                //South
                if (y < this.height - 1) {
                    xModifier = 0;
                    yModifier = 1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : this.tiles[x + xModifier][y + yModifier].cost
                }
                //South west
                if (y < this.height - 1 && x > 0) {
                    xModifier = -1;
                    yModifier = 1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : parseFloat(Math.sqrt(2 * Math.pow(this.tiles[x + xModifier][y + yModifier].cost, 2)).toFixed(3));
                }
                //West
                if (x > 0) {
                    xModifier = -1;
                    yModifier = 0;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : this.tiles[x + xModifier][y + yModifier].cost
                }
                //North west
                if (x > 0 && y > 0) {
                    xModifier = -1;
                    yModifier = -1;
                    propertyName = x + xModifier === finishX && y + yModifier === finishY ? 'finish' : (x + xModifier) + '/' + (y + yModifier);
                    node[propertyName] = this.tiles[x + xModifier][y + yModifier].party !== null && this.tiles[x + xModifier][y + yModifier].party.player === game.currentPlayer  ? Infinity : parseFloat(Math.sqrt(2 * Math.pow(this.tiles[x + xModifier][y + yModifier].cost, 2)).toFixed(3));
                }
                graph[x + '/' + y] = node;
            }
        }
        graph['start'] = graph[startX + '/' + startY];
        delete graph[startX + '/' + startY];
        graph['finish'] = graph[finishX + '/' + finishY];
        graph['finish'].x = finishX;
        graph['finish'].y = finishY;
        delete graph[finishX + '/' + finishY];
        return graph;
    }
    lowestCostNode (costs, processed) {
          return Object.keys(costs).reduce((lowest, node) => {

            if (lowest === null || costs[node] < costs[lowest]) {
              if (!processed.includes(node)) {
                lowest = node;
              }
            }
            // console.log('lowest', costs[lowest]);
            return lowest;
          }, null);
    };
    // function that returns the minimum cost and path to reach Finish
  dijkstra (graph) {
      const startTime = new Date();
  // track lowest cost to reach each node
  const costs = Object.assign({finish: Infinity}, graph.start);
  // track paths
  const parents = {finish: null};
  for (let child in graph.start) {
    parents[child] = 'start';
  }

  // track nodes that have already been processed
  const processed = [];

  let node = this.lowestCostNode(costs, processed);

  while (node) {
    let cost = costs[node];
    let children = graph[node];
    for (let n in children) {
        let newCost = cost + children[n];
        if (!costs[n]) {
          costs[n] = newCost;
          parents[n] = node;
        }
        if (costs[n] > newCost) {
          costs[n] = newCost;
          parents[n] = node;
        }
    }
    processed.push(node);
    node = this.lowestCostNode(costs, processed);
  }

  let optimalPath = ['finish'];
  let parent = parents.finish;
  while (parent) {

      optimalPath.push(parent);
      parent = parents[parent];
  }
  optimalPath.reverse();
  const pathStart = optimalPath[0];

  game.currentParty.path = optimalPath.map((step, index, array)=>{
      let x;
      let y;
      if (step !== 'finish') {
          x = parseInt(step.split('/')[0]);
          y = parseInt(step.split('/')[1]);
      }
      else {
          x = graph.finish.x;
          y = graph.finish.y;
      }

      // do poprawy
      if (index === 0) {
          return {};
      }
          return {x: x,
                  y: y,
                  cost: graph[array[index-1]][array[index]]};
  });
  game.currentParty.path.shift();
  game.draw();
  const results = {
    distance: costs.finish,
    path: optimalPath
  };
  console.log(`Calculating path took: ${(new Date() - startTime) / 1000} seconds, for ${Object.keys(graph).length} nodes`);
  return game.currentParty.path;
};


}

class Camera {
    constructor (settings) {
        this.x = 0;
        this.y = 0;
        this.follow = true;
    }
    center (x, y) {
        let tilesX = Math.floor(game.gameWidth / game.tileSide);
        let tilesY = Math.floor(game.gameHeight / game.tileSide);

        if (x - Math.floor(tilesX * 0.5) >= 0 && x + Math.floor(tilesX * 0.5) < game.map.width) {
            game.camera.x = x - tilesX*0.5 + 1;
        }
        else if (x - Math.floor(tilesX * 0.5) <= 0) {
            game.camera.x = 0;
        }
        else if (x - Math.floor(tilesX * 0.5) >= game.map.width - tilesX) {
            game.camera.x = game.map.width - tilesX;
        }

        if (y - Math.floor(tilesY * 0.5) >= 0 && y + Math.floor(tilesY * 0.5) < game.map.height) {
            game.camera.y = y - Math.floor(tilesY * 0.5) + 1;
        }
        else if (y - Math.floor(tilesY * 0.5) <= 0) {
            game.camera.y = 0;
        }
        else if (y - Math.floor(tilesY * 0.5) >= tilesY) {
            game.camera.y = game.map.height - tilesY;
        }
    }
}

class Player {
    constructor (settings) {
        this.name = settings.name;
        this.color = settings.color;
        this.parties = [];
        this.towns = [];
        this.buildings = [];
        this.id = settings.id;
    }
    addParty (settings) {
        this.parties.push(new Party(settings))
        this.parties[this.parties.length-1].player = this.id;
    }
    startNewTurn () {
        this.parties.forEach((party)=>{
            party.movePoints = party.maxMovePoints;
            game.interface.endTurnButton.style.backgroundColor = this.color;
        });
        let tilesX = Math.floor(game.gameWidth / game.tileSide);
        let tilesY = Math.floor(game.gameHeight / game.tileSide);
        //Do poprawy
        game.camera.center(game.currentParty.x, game.currentParty.y);

    }
}

class Party {
    constructor (settings) {
        this.name = settings.name;
        this.x = settings.x;
        this.y = settings.y;
        this.path = [];
        this.maxMovePoints = settings.maxMovePoints;
        this.movePoints = this.maxMovePoints;
        this.player;
    }
}

class Interface {
    constructor(settings){
        this.width = settings.width;
        this.height = settings.height;
        this.canvas = settings.canvas
    }
    attachMapInterface () {
        if (typeof this.height !== 'number') {
            this.height = this.canvas.height;
        }
        this.userInterface = document.createElement('div');
        this.userInterface.id = 'map_interface';
        this.endTurnButton = document.createElement('button');
        this.endTurnButton.id = 'end_turn_button';
        this.userInterface.appendChild(this.endTurnButton);
        this.canvas.insertAdjacentElement('afterend', this.userInterface);

        const interfaceStyles = `
            width: ${this.width}px;
            height: ${this.height}px;
            border: 3px solid black;
            border-left: none;
            display: flex;
            align-items: center;
            justify-content: center;
            background: silver;
        `;
        const endTurnButtonStyles = `
            width: 100px;
            height: 100px;
            border: 3px solid red;
            border-radius: 50%;
        `;

        this.userInterface.style = interfaceStyles;
        this.endTurnButton.style = endTurnButtonStyles;
        game.interface.endTurnButton.style.backgroundColor = game.players[game.currentPlayer].color;
        this.endTurnButton.addEventListener('click', game.endTurnHandle.bind(game));
    }
}

class Game {
    constructor (settings) {
        this.gameWidth = settings.gameWidth;
        this.gameHeight = settings.gameHeight;
        this.mapWidth = settings.mapWidth;
        this.mapHeight = settings.mapHeight;
        this.tileSide = settings.tileSide;

        canvas.setAttribute('width', this.gameWidth);
        canvas.setAttribute('height', this.gameHeight);

        this.map = new Map(this.mapWidth, this.mapHeight);
        this.camera = new Camera();
        this.interface = new Interface({width: 200, canvas: canvas});

        this.players = [];
        this.currentPlayer; //number
        this.currentParty;
    };

    addPlayer (settings) {
        settings.id = this.players.length;
        this.players.push(new Player(settings));
    }

    synchroniseMap () {
        this.players.forEach((player)=>{
            player.parties.forEach((party)=>{
                if (this.map.tiles[party.x][party.y].party === null) {
                    console.log('Added party at %s / %s', party.x, party.y);
                    this.map.tiles[party.x][party.y].party = party;
                }

            });
        });
    }

    draw () {
        this.synchroniseMap ();
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
                    ctx.fillStyle = this.players[this.map.tiles[x][y].party.player].color;
                    ctx.arc((x - this.camera.x) * this.tileSide + Math.floor(this.tileSide / 2), (y - this.camera.y) * this.tileSide + Math.floor(this.tileSide / 2), Math.floor(this.tileSide / 2), 0, 2*Math.PI);
                    ctx.fill();
                }

            }
        }
        if (this.currentParty !== null && this.currentParty.path.length > 0) {
            let pointsLeft = this.currentParty.movePoints;

            this.currentParty.path.forEach((point) => {
                pointsLeft -= point.cost;
                ctx.fillStyle= pointsLeft > 0 ? 'lime' : 'red';
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

        if (this.map.tiles[x][y].party !== null && this.map.tiles[x][y].party.player === this.currentPlayer) {
            this.currentParty = this.map.tiles[x][y].party;
        }
        else if (this.currentParty.path.length === 0) {
            // this.currentParty.path = this.map.getPath(previousX, previousY, x, y);
            this.currentParty.path = this.map.dijkstra(this.map.getGraph(previousX, previousY, x, y));
        }
        else if (this.map.moveInterval !== null) {
            clearInterval(this.map.moveInterval);
            this.map.moveInterval = null;
        }
        else if (this.currentParty.path[this.currentParty.path.length-1].x === x && this.currentParty.path[this.currentParty.path.length-1].y === y){
            this.map.moveParty(this.currentParty, this.currentParty.path)
        }
        else {
            // this.currentParty.path = this.map.getPath(previousX, previousY, x, y);
            this.currentParty.path = this.map.dijkstra(this.map.getGraph(previousX, previousY, x, y));
        }
        this.draw();
    }

    endTurnHandle (event) {
        if (this.map.moveInterval !== null) {
            return;
        }
        this.currentPlayer = (this.currentPlayer < this.players.length - 1) ? this.currentPlayer + 1 : 0;
        this.currentParty = this.players[this.currentPlayer].parties.length > 0 ? this.players[this.currentPlayer].parties[0] : null;
        this.players[this.currentPlayer].startNewTurn();
        game.draw();
    }

}


const game = new Game({
    gameWidth: 1200,
    gameHeight: 800,
    mapWidth: 32,
    mapHeight: 32,
    tileSide: 50
});

game.addPlayer({
    name: 'Pawel',
    color: 'purple'
});

game.addPlayer({
    name: 'Michal',
    color: 'pink'
});


game.players[0].addParty({
    name: 'Kurwa',
    x: 3,
    y: 5,
    maxMovePoints: 500
});

game.players[0].addParty({
    name: 'Szmata',
    x: 5,
    y: 7,
    maxMovePoints: 500
});

game.players[1].addParty({
    name: 'Chuj',
    x: 9,
    y: 9,
    maxMovePoints: 500
});

game.players[1].addParty({
    name: 'Dupa',
    x: 8,
    y: 6,
    maxMovePoints: 500
});

game.currentParty = game.players[0].parties[0];
// game.map.tiles[3][5].party = (game.players[0].parties[0]);

// game.map.tiles[5][7].party = (game.players[0].parties[1]);
game.currentPlayer = 0;
game.interface.attachMapInterface();

game.draw();
//
// drawHex (x, y, side) => {
//     ctx.beginPath();
//     ctx.moveTo(x, y);
//     ctx.strokeStyle = 'black';
//
// };


document.addEventListener('DOMContentLoaded', ()=> {
    window.addEventListener('keydown', game.gameMapArrowHandle.bind(game));

    canvas.addEventListener('click', game.gameMapClickHandle.bind(game));
});

/*
TODO
Przemieszczanie na mapie:
    /* Optymalizacja grafu dla dużych map */
