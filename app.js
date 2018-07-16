const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('interface');

class Tile {
    constructor () {
        this.surface = Math.random() > 0.6 ? 'sand' : 'snow';
        this.building = null;
        this.party = null;
        this.cost = this.surface === 'sand' ? 200 : 15;
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
                //Do zamiany na przyjaznych graczy);
                if (this.tiles[path[0].x][path[0].y].party !== null && this.tiles[path[0].x][path[0].y].party.player !== game.currentPlayer) {
                    console.log('FIGTH!');
                    clearInterval(this.moveInterval);
                    this.moveInterval = null;
                    return;
                }
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


    getRelativeTile(x, y, xVector, yVector) {
        let result = {x: x + xVector, y: y + yVector};
        if (result.x < 0 || result.x >= this.width || result.y < 0 || result.y >= this.width) {
            return null;
        }
        return {x: x + xVector, y: y + yVector};
    }


    getGraph (startX, startY, finishX, finishY) {
        const graph = {};

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let xModifier;
                let yModifier;
                let propertyName;
                let node = {};

                //getAllAdjacentTiles
                for (let i = -1; i <= 1; i++) {
                    for (var j = -1; j <= 1; j++) {
                        let result = this.getRelativeTile(x, y, i, j);
                        if (result !== null) {
                            propertyName = result.x === finishX && result.y === finishY ? 'finish' : result.x + '/' + result.y;
                            node[propertyName] = this.tiles[result.x][result.y].party !== null && this.tiles[result.x][result.y].party.player === game.currentPlayer ?
                            Infinity : Math.abs(i) + Math.abs(j) === 1 ?
                            this.tiles[result.x][result.y].cost :
                            Math.sqrt(2 * Math.pow(this.tiles[result.x][result.y].cost, 2));
                        }
                    }
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

class Unit {
    constructor (settings) {
        this.name = settings.name;
        this.attributes = settings.attributes;
        this.hp;
        this.mp;
        this.ap;
        this.calculateStats();
        this.eq = {
            armor :null,
            leftHand: null,
            rightHand: null,
            bag: null
        }
    }
    calculateStats () {
        this.hp = this.attributes.endurance * 2;
        this.mp = this.attributes.willPower * 2;
        this.ap = this.attributes.dexterity * 2;
    }
    calculateAttributes () {
        for (let item in this.eq) {
            if (item === 'bag') {
                continue;
            }
            if (this.eq[item] !== null && this.eq[item] !== undefined) {
                for(let stat in this.eq[item].modifiers) {
                    if (this[stat] !== undefined && this[stat] !== null) {
                        this[stat] = this.eq[item].modifiers[stat](this[stat]);
                    }
                }
            }
        }
    }
    putOnItem (item) {
        if (this.eq[item.placement] !== null) {
            this.eq.bag = this.eq[item.placement];
        }
        this.eq[item.placement] = item;
        this.calculateStats();
        this.calculateAttributes();
    }
}

class Item {
    constructor (settings) {
        this.name = settings.name;
        this.placement = settings.placement;
        this.modifiers = settings.modifiers;
    }
}

class Hero extends Unit {
    constructor(settings) {

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
        this.members = [];
        this.membersCap = typeof settings.membersCap === 'number' ? settings.membersCap : 6;
    }
    addUnit (settings) {
        if (this.members.length < this.membersCap) {
            this.members.push(new Unit(settings));
            return true;
        }
        return false;
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
    openPartyWindow (secondParty) {
        game.pauseListeners = true;
        this.partyWindow = document.createElement('div');

        this.partyWindow.id = 'party-window';
        document.getElementById('container').appendChild(this.partyWindow);
        this.partyWindow.innerHTML = `
            <div class="party-name-wrapper">
                <h2 class="party-name">${game.currentParty.name}</h2>
            </div>
            <div class="party-left-panel">
                <ul class="units-list"></ul>
            </div>
            <div class="party-right-panel">
                <h2 class="unit-name"></h2>
                <div class="unit-stats">
                    <p class="unit-stats-hp"></p>
                    <p class="unit-stats-mp"></p>
                    <p class="unit-stats-ap"></p>
                </div>
                <div class="unit-attributes">
                    <p class="unit-attributes-str"></p>
                    <p class="unit-attributes-dex"></p>
                    <p class="unit-attributes-wp"></p>
                </div>
                <div class="unit-eq">
                    <p class="unit-eq-right"></p>
                    <p class="unit-eq-left"></p>
                    <p class="unit-eq-armor"></p>
                    <p class="unit-eq-bag"></p>
                </div>
            </div>
        `;
        let unitsList = document.querySelector('#party-window .units-list');
        unitsList.addEventListener('click', this.unitsListClickHandle);
        unitsList.innerHTML = game.currentParty.members.map((unit, index) => {
            return `
                <li class="units-list-unit" data-index="${index}">
                    <h3>${unit.name}</h3>
                </li>`;
            }).join('');
    }

    closePartyWindow () {
        var partyWindow = document.getElementById('party-window');
        if (partyWindow !== null) {
            partyWindow.remove();
        }
        game.pauseListeners = false;
    }

    unitsListClickHandle (event) {
        let previousActive = document.querySelector('.active-unit');
        let active = event.target.closest('li');
        if (previousActive !== null) {
            previousActive.classList.remove('active-unit');
        }
        active.classList.add('active-unit');
        console.log(this);
        game.interface.updateRightPanel(game.currentParty.members[active.dataset.index]);
    }

    updateRightPanel (unit) {
        let panel = document.querySelector('.party-right-panel')
        let nodes = {
            name: panel.querySelector('.unit-name'),
            hp: panel.querySelector('.unit-stats-hp'),
            mp: panel.querySelector('.unit-stats-mp'),
            ap: panel.querySelector('.unit-stats-ap'),
            str: panel.querySelector('.unit-attributes-str'),
            dex: panel.querySelector('.unit-attributes-dex'),
            wp: panel.querySelector('.unit-attributes-wp'),
        };
        nodes.name.textContent = unit.name;
    }

}

class Game {
    constructor (settings) {
        this.gameWidth = settings.gameWidth;
        this.gameHeight = settings.gameHeight;
        this.mapWidth = settings.mapWidth;
        this.mapHeight = settings.mapHeight;
        this.tileSide = settings.tileSide;
        this.textures = {
            grass: new Image(this.tileSide, this.tileSide),
            stones: new Image(this.tileSide, this.tileSide)
        };
        this.textures.grass.src = './Sprites/grass.png';
        this.textures.stones.src = './Sprites/stones.png'

        canvas.setAttribute('width', this.gameWidth);
        canvas.setAttribute('height', this.gameHeight);

        this.map = new Map(this.mapWidth, this.mapHeight);
        this.camera = new Camera();
        this.interface = new Interface({width: 200, canvas: canvas});

        this.players = [];
        this.currentPlayer; //number
        this.currentParty;
        this.pauseListeners = false;
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

    areAssetsLoaded () {
        return !Object.values(this.textures).some(texture => !texture.complete);
    }

    draw () {
        this.synchroniseMap ();
        ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        for (let x = this.camera.x; x < this.camera.x + Math.floor(this.gameWidth / this.tileSide); x++) {
            for (let y = this.camera.y; y < this.camera.y + Math.floor(this.gameHeight / this.tileSide); y++) {
                let texture = null;
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                if (this.map.tiles[x][y].surface === 'sand') {
                    // ctx.fillStyle= 'yellow';
                    texture = this.textures.stones;
                }
                else {
                    // ctx.fillStyle= 'black';
                    texture = this.textures.grass;
                }
                 ctx.drawImage(texture, (x - this.camera.x) * this.tileSide, (y - this.camera.y) * this.tileSide);
                    // ctx.rect((x - this.camera.x) * this.tileSide, (y - this.camera.y) * this.tileSide, this.tileSide, this.tileSide);
                    // ctx.fill();
                    // ctx.stroke();
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
        if (game.pauseListeners) return;
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
        if (game.pauseListeners) {
            if (document.getElementById('party-window') !== null) {
                game.interface.closePartyWindow();
            }
            return;
        }
        let x = this.camera.x + Math.floor(event.offsetX / game.tileSide);
        let y = this.camera.y + Math.floor(event.offsetY / game.tileSide);

        let previousX = this.currentParty.x;
        let previousY = this.currentParty.y;

        if (this.map.tiles[x][y].party !== null && this.map.tiles[x][y].party.player === this.currentPlayer) {
            if (this.map.tiles[x][y].party === this.currentParty) {
                game.interface.openPartyWindow();
            }
            else {
                this.currentParty = this.map.tiles[x][y].party;
            }
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
        if (game.pauseListeners) return;
        if (this.map.moveInterval !== null) {
            return;
        }
        this.currentPlayer = (this.currentPlayer < this.players.length - 1) ? this.currentPlayer + 1 : 0;
        this.currentParty = this.players[this.currentPlayer].parties.length > 0 ? this.players[this.currentPlayer].parties[0] : null;
        this.players[this.currentPlayer].startNewTurn();
        game.draw();
    }

}
/* Do pola bitwy */
function drawHexagon(x, y, fill) {
        var fill = fill || false;

        var hexHeight,
        hexRadius,
        hexRectangleHeight,
        hexRectangleWidth,
        hexagonAngle = 0.523598776, // 30 degrees in radians
        sideLength = 36,
        boardWidth = 10,
        boardHeight = 10;

        hexHeight = Math.sin(hexagonAngle) * sideLength;
        hexRadius = Math.cos(hexagonAngle) * sideLength;
        hexRectangleHeight = sideLength + 2 * hexHeight;
        hexRectangleWidth = 2 * hexRadius;

        ctx.beginPath();
        ctx.moveTo(x + hexRadius, y);
        ctx.lineTo(x + hexRectangleWidth, y + hexHeight);
        ctx.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
        ctx.lineTo(x + hexRadius, y + hexRectangleHeight);
        ctx.lineTo(x, y + sideLength + hexHeight);
        ctx.lineTo(x, y + hexHeight);
        ctx.closePath();

        if(fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }


const game = new Game({
    gameWidth: 1400,
    gameHeight: 900,
    mapWidth: 32,
    mapHeight: 32,
    tileSide: 100
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
    name: 'Andrzej',
    x: 3,
    y: 5,
    maxMovePoints: 500
});

game.players[0].addParty({
    name: 'Jerzy',
    x: 5,
    y: 7,
    maxMovePoints: 500
});

game.players[1].addParty({
    name: 'Grzegorz',
    x: 9,
    y: 9,
    maxMovePoints: 500
});

game.players[1].addParty({
    name: 'Antoni',
    x: 8,
    y: 6,
    maxMovePoints: 500
});



game.currentParty = game.players[0].parties[0];
// game.map.tiles[3][5].party = (game.players[0].parties[0]);

// game.map.tiles[5][7].party = (game.players[0].parties[1]);
game.currentPlayer = 0;
game.interface.attachMapInterface();

let assetsInterval = setInterval(() => {
    if (game.areAssetsLoaded()) {
        game.draw();
        Object.values(game.textures).forEach(texture => console.log(texture.complete))
        clearInterval(assetsInterval);
    }
}, 50);


// game.draw();
//
// drawHex (x, y, side) => {
//     ctx.beginPath();
//     ctx.moveTo(x, y);
//     ctx.strokeStyle = 'black';
//
// };
const itemsList = [];
itemsList.push(new Item ({name: 'Shield of endurance',
                          modifiers: {
                              hp: (hp)=>{return hp+20;}
                          },
                          placement: 'leftHand'}));

itemsList.push(new Item ({name: 'Shield of dexterity',
                          modifiers: {
                            hp: (hp)=>{return hp+10;},
                            ap: (ap)=>{return ap+15;}
                          },
                          placement: 'leftHand'}));

document.addEventListener('DOMContentLoaded', ()=> {
    window.addEventListener('keydown', game.gameMapArrowHandle.bind(game));

    canvas.addEventListener('click', game.gameMapClickHandle.bind(game));

});

game.currentParty.addUnit({name: 'Najlepsza jednostka na świecie', attributes:{endurance:10, willPower: 10, dexterity:10}});
game.currentParty.members[0].putOnItem(itemsList[0]);

game.currentParty.addUnit({name: 'Najgorsza jednostka na świecie', attributes:{endurance:5, willPower: 5, dexterity:55}});
game.currentParty.members[0].putOnItem(itemsList[1]);

/*
TODO
Przemieszczanie na mapie:
    /* Optymalizacja grafu dla dużych map */
