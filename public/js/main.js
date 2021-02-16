// https://www.cs.bu.edu/fac/best/res/papers/alybull86.pdf

const defaults = ["red","green","blue","yellow", "purple", "orange"]
const prettyDefaults = ['#F1CF28', '#B143EA', '#2C81E7', '#EE6D2C', '#59C32B', '#E53232']


var socket = io();

var app = new Vue({
    el: "#app",
    data: {
        error: false,
        colorIndex: 0,
        drag: false,
        codeLength: 4,
        showHelp: false,

        gameStarted: false,

        game: {
            id: '',
            players: [],
            bgColor: '#000000',
            palette: [],
            code: [],
            guess: [],
            codes: [],
            guesses: [],
        },

        player: {
            name: '',
            role: 'maker'
        }
    },
    computed: {

        codeErrors() {
            let errors = []
            for (let i = 0; i < this.game.guesses.length; i++) {
                const check = this.checkCode(i)
                errors.push(check)
            }
            return errors
        },

        turn() {
            return (this.game.guesses.length == this.game.codes.length) ? 'maker' : 'breaker'
        },
        rounds() {
            return this.game.guesses.length
        },
        adjRounds() {
            return this.game.codes.length
        },
        redPegs() {
            let n = 0
            for (let i = 0; i < this.game.code.length; i++) {
                if (this.game.code[i] == this.game.guess[i]) {
                    n++
                }
            }
            return n
        },
        whitePegs() {

            total = 0
            let codeLst = []
            let guessLst = []

            for (let i = 0; i < this.game.palette.length; i++) {
                codeLst.push(this.game.code.filter(c => (c == this.game.palette[i])).length)
                guessLst.push(this.game.guess.filter(c => (c == this.game.palette[i])).length)
            }

            for (let i = 0; i < codeLst.length; i++) {
                total += Math.min(codeLst[i], guessLst[i])
            }

            return total - this.redPegs
        },
        dragOptions() {
            return {
                animation: 400,
                dragClass: 'dragging',
                chosenClass: 'chosen',
                ghostClass: 'ghost'
            };
        }
    },
    created() {
       
        socket.on("connect", () => {
            console.log(`connecting to socket ${socket.id}`);
        });

        socket.on('new player', (player) => {
            console.log("detecting new player", player)
            this.game.players.push(player)
            if (this.game.players.length == 2) {
                console.log("both players joined, start the game!")
                socket.emit('start game', this.game.id)
            }
        });

        socket.on('game ready', (gameID) => {
            this.game.id = gameID;
            console.log("game is initiated with id:", this.game.id)

            var refresh = window.location.protocol
                + "//" + window.location.host
                + window.location.pathname
                + `?id=${this.game.id}`;  
  
            window.history.pushState({ path: refresh }, '', refresh);

        })

        socket.on('game incoming', (game) => {
            this.game = game;
            console.log("GAME INCOMING")
            if (this.game.players.length == 2) {
                console.log("ALREADY TWO PLAYERS")
                this.error = true
                return false
            }
            this.initGuess()
        })

        socket.on('code incoming', (code) => {
            this.game.codes.push([...code]);
            this.game.code = [...code];
        })

        socket.on('guess incoming', (guess) => {
            const g = {
                content: [...guess.content],
                redPegs: guess.redPegs,
                whitePegs: guess.whitePegs,
                round: guess.round
            }
            this.game.guesses.push(g)
            this.game.guess = [...guess.content];
        })

        socket.on('send game', (game) => {
            this.game = game;
        })

        socket.on('retrieve game', () => {
            if (this.player.role == 'maker') {
                console.log(this.game)
                socket.emit('game object', this.game)
                console.log("successfully retrieved game")
            }
        })

        socket.on('game started', () => {
            console.log("game starts now")
            this.gameStarted = true
            
            // window.onbeforeunload = function (e) {
            //     e = e || window.event;
            
            //     // For IE and Firefox prior to version 4
            //     if (e) {
            //         e.returnValue = 'Sure?';
            //     }
            
            //     // For Safari
            //     return 'Sure?';
            // };

        })

        socket.on('new guess', (guess) => {
            console.log("new guess:", guess)
            this.game.guesses.push(guess)
        })
        
        socket.on("disconnect", () => {
            console.log(socket.id);
        });
    },
    methods: {
        copyGameURL() {
            var input = document.body.appendChild(document.createElement("input"));
            input.value = window.location.href + '&role=breaker';
            input.focus();
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
            input.parentNode.removeChild(input);
        },
        createGame() {

            if (!this.player.name.length) return false

            axios({
                method: 'get',
                url: 'https://raw.githubusercontent.com/Jam3/nice-color-palettes/master/100.json',
                
            }).then((response) => {
                let palettes = response.data
                const palette = palettes[Math.floor(Math.random() * palettes.length)];    
                // this.game.palette = [ palette['0'], palette['1'], palette['2'], palette['3'] ]
                this.game.palette = prettyDefaults
                this.game.bgColor = palette['4']
                this.initCode()
                console.log(this.game.palette)

                socket.emit('create game', this.player.name, this.game);

            }).catch((error) => {
                console.log(error);
            });

        },
        joinGame() {
            if (!this.player.name.length) return false
            socket.emit('add breaker', this.game.id, this.player.name)
        },
        initGuess() {
            var lst = this.game.palette.slice(0)
            this.shuffle(lst)
            this.game.guess = lst.slice(0, this.codeLength)
        },
        shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
            
                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            return array;
        },

        initDrag() {

            setTimeout(() => {
                var $els = document.getElementsByClassName('draggable') 
                console.log($els)
                var all_draggable_elements = Array.prototype.slice.call( $els )
    
                var dragIcon = document.createElement('img');
                dragIcon.src = './assets/pixel.png';
    
                for (var i = 0; i < all_draggable_elements.length; i++) {
                    console.log("draggable el")
                    all_draggable_elements[i].addEventListener('dragstart', function(event) {
                        event.dataTransfer.setDragImage(dragIcon, 0, 0);
                    });
                }


            }, 0);
        },

        initCode() {
            var lst = this.game.palette.slice(0)
            this.shuffle(lst)
            this.game.code = lst.slice(0, this.codeLength)
        },

        checkCode(i) {
            if (this.adjRounds == 0) {
                return true
            }
            
            const guess = this.game.guesses[i]
            const code = this.game.codes[i]

            let redPegs = 0
            let whitePegs = 0

            // get redPegs
            for (let i = 0; i < this.game.code.length; i++) {
                if (this.game.code[i] == this.game.guess[i]) {
                    redPegs++
                }
            }
    
            // get whitePegs
            let total = 0
            let codeLst = []
            let guessLst = []
            for (let i = 0; i < this.game.palette.length; i++) {
                codeLst.push(code.filter(c => (c == this.game.palette[i])).length)
                guessLst.push(guess.content.filter(c => (c == this.game.palette[i])).length)
            }
            for (let i = 0; i < codeLst.length; i++) {
                total += Math.min(codeLst[i], guessLst[i])
            }
            whitePegs = total - redPegs

            if (guess.redPegs == redPegs && guess.whitePegs == whitePegs) {
                console.log(`ROUND ${guess.round} PASSES THE CHECK`)
                return true
            }
            else {
                console.log(`ROUND ${guess.round} FAILS THE CHECK:`)
                console.log(`white: ${whitePegs} vs ${guess.whitePegs}`)
                console.log(`red: ${redPegs} vs ${guess.redPegs}`)
                return false
            }

        },

        submitCode() {

            let errors = 0
            for (let i = 0; i < this.game.guesses.length; i++) {
                errors += this.checkCode(i) ? 0 : 1
            }
            if (errors == 0) {
                socket.emit('new code', this.game.id, this.game.code);
            }
            else {
                // delete:
                socket.emit('new code', this.game.id, this.game.code);
            }

        },

        submitGuess() {
            let round = this.game.guesses.length + 1
            const guess = {
                redPegs: this.redPegs,
                whitePegs: this.whitePegs,
                content: this.game.guess.slice(0),
                round: round
            }
            socket.emit('new guess', this.game.id, guess);
        },
        
        cycleColor(index, color, type) {
            console.log("cycling color for", type);
            
            let n = this.game.palette.indexOf(color)
            let m = 0
            if (n < this.game.palette.length - 1) {
                m = n + 1
            }
            let newColor = this.game.palette[m] 

            switch (type) {
                case 'guess':
                    this.game.guess.splice(index, 1, newColor)
                    break;
                case 'code':
                    this.game.code.splice(index, 1, newColor)
                    break;
                default:
                    break;
            }

            
        },

        checkGuess() {            
            for (let i = 0; i < this.game.guess.length; i++) {
                if (this.game.guess[i] == this.game.code[i]) {
                    this.game.code[i].locked = true
                }
                else {
                    this.game.code[i].locked = false
                }
            }
        }
    },



    watch: {
        // guess() {
        //     this.checkGuess()
        // }
    },
    mounted() {        

        // document.onkeypress = function (e) {
        //     if (e.keyCode == 13) {
        //         if (app.player.role == 'breaker') app.submitGuess()
        //     }
        // }

        this.$refs.makerName.focus()

        this.initDrag()

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const gameID = urlParams.get('id')
        const role = urlParams.get('role')
        console.log("gameID", gameID)

        if (gameID && this.game.players && role == 'breaker') {
            this.game.id = gameID 
            this.player.role = 'breaker'
            console.log("GAME ID FOUND IN URL PARAMS")
            socket.emit('join game', this.game.id);
            console.log("trying to pull game object", this.game.id)
        }
        else if (gameID && !role) {
            console.log("ASDFASDF")
            window.location.href = "/";
        }

    }
})