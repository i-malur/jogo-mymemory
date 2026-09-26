const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const livesEl = document.getElementById('lives');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restartBtn');
const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');

// Configurações do grid: 8x5 (40 cartas) em um canvas de 1000x700
const cols = 8;
const rows = 5;
const cardWidth = 105;
const cardHeight = 115;
const paddingX = (canvas.width - (cols * cardWidth)) / (cols + 1);
const paddingY = (canvas.height - (rows * cardHeight)) / (rows + 1);

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let lives = 5;
let timeRemaining = 90;
let timerInterval;
let gameStatus = 'playing';
let isContinuing = false; // Flag para saber se mantemos as vidas no restart

// Personagens Disney (20 personagens -> 40 cartas)
const characters = [
    { name: 'Mickey', color: '#e74c3c', emoji: '🐭' },
    { name: 'Minnie', color: '#e84393', emoji: '🎀' },
    { name: 'Donald', color: '#3498db', emoji: '🦆' },
    { name: 'Pateta', color: '#f39c12', emoji: '🐕' },
    { name: 'Pluto', color: '#f1c40f', emoji: '🦴' },
    { name: 'Simba', color: '#d35400', emoji: '🦁' },
    { name: 'Ariel', color: '#1abc9c', emoji: '🧜‍♀️' },
    { name: 'Elsa', color: '#74b9ff', emoji: '❄️' },
    { name: 'Olaf', color: '#dfe6e9', emoji: '⛄' },
    { name: 'Stitch', color: '#0984e3', emoji: '👽' },
    { name: 'Woody', color: '#e67e22', emoji: '🤠' },
    { name: 'Buzz', color: '#2ecc71', emoji: '🚀' },
    { name: 'Nemo', color: '#d35400', emoji: '🐟' },
    { name: 'Dory', color: '#3498db', emoji: '🐠' },
    { name: 'Aladdin', color: '#9b59b6', emoji: '🧞‍♂️' },
    { name: 'Jasmine', color: '#1abc9c', emoji: '🐅' },
    { name: 'Moana', color: '#e74c3c', emoji: '🛶' },
    { name: 'Mulan', color: '#c0392b', emoji: '🐉' },
    { name: 'Bela', color: '#f1c40f', emoji: '📚' },
    { name: 'Fera', color: '#8e44ad', emoji: '🐾' }
];

const images = {};
characters.forEach(char => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cardWidth;
    tempCanvas.height = cardHeight;
    const tCtx = tempCanvas.getContext('2d');
    
    const gradient = tCtx.createLinearGradient(0, 0, 0, cardHeight);
    gradient.addColorStop(0, char.color);
    gradient.addColorStop(1, '#2c3e50');
    tCtx.fillStyle = gradient;
    
    tCtx.beginPath();
    tCtx.roundRect(0, 0, cardWidth, cardHeight, 12);
    tCtx.fill();
    
    tCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    tCtx.lineWidth = 4;
    tCtx.stroke();
    
    tCtx.fillStyle = '#fff';
    tCtx.font = '40px Arial';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(char.emoji, cardWidth / 2, cardHeight / 2 - 15);

    tCtx.font = 'bold 16px Arial';
    tCtx.shadowColor = 'rgba(0,0,0,0.8)';
    tCtx.shadowBlur = 4;
    tCtx.fillText(char.name, cardWidth / 2, cardHeight / 2 + 25);
    
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    images[char.name] = img;
});

const backImage = (() => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cardWidth;
    tempCanvas.height = cardHeight;
    const tCtx = tempCanvas.getContext('2d');
    
    const gradient = tCtx.createLinearGradient(0, 0, cardWidth, cardHeight);
    gradient.addColorStop(0, '#8e44ad');
    gradient.addColorStop(1, '#2980b9');
    tCtx.fillStyle = gradient;
    
    tCtx.beginPath();
    tCtx.roundRect(0, 0, cardWidth, cardHeight, 12);
    tCtx.fill();
    
    tCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    tCtx.lineWidth = 4;
    tCtx.stroke();
    
    tCtx.fillStyle = '#fff';
    tCtx.font = 'bold 50px Arial';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.shadowColor = 'rgba(0,0,0,0.5)';
    tCtx.shadowBlur = 8;
    tCtx.fillText('✨', cardWidth / 2, cardHeight / 2);
    
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    return img;
})();

function initGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    
    if (!isContinuing) {
        lives = 5;
    }
    isContinuing = false; // Reset da flag para a próxima rodada
    
    timeRemaining = 90;
    gameStatus = 'playing';
    gameModal.style.display = 'none'; // Esconde o modal customizado
    canvas.style.cursor = 'pointer';
    
    updateStatusBar();
    
    let deck = [];
    characters.forEach(char => {
        deck.push(char.name);
        deck.push(char.name);
    });
    
    deck.sort(() => Math.random() - 0.5);
    
    let index = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cards.push({
                x: paddingX + c * (cardWidth + paddingX),
                y: paddingY + r * (cardHeight + paddingY),
                width: cardWidth,
                height: cardHeight,
                character: deck[index],
                isFlipped: false,
                isMatched: false
            });
            index++;
        }
    }
    
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    draw();
}

function updateTimer() {
    if (gameStatus !== 'playing') return;
    
    timeRemaining--;
    
    if (timeRemaining <= 0) {
        lives--;
        clearInterval(timerInterval);
        canvas.style.cursor = 'default';
        
        if (lives <= 0) {
            lives = 0;
            gameStatus = 'gameover';
            isContinuing = false; // Próximo jogar novamente reseta as vidas
            showModal('GAME OVER', 'Você ficou sem vidas!', '#e74c3c');
        } else {
            gameStatus = 'timeout';
            isContinuing = true; // Próximo jogar novamente mantém a contagem de vidas
            showModal('TEMPO ESGOTADO!', `Você perdeu 1 vida! Restam: ${lives}`, '#e67e22');
        }
    }
    updateStatusBar();
    draw();
}

function updateStatusBar() {
    livesEl.innerText = `❤️ Vidas: ${lives}`;
    let minutes = Math.floor(timeRemaining / 60);
    let seconds = timeRemaining % 60;
    timerEl.innerText = `⏱️ Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cards.forEach(card => {
        if (card.isFlipped || card.isMatched) {
            if (images[card.character].complete) {
                ctx.drawImage(images[card.character], card.x, card.y, card.width, card.height);
            }
        } else {
            if (backImage.complete) {
                ctx.drawImage(backImage, card.x, card.y, card.width, card.height);
            }
        }
        
        if (card.isMatched) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.width, card.height, 12);
            ctx.fill();
        }
    });
}

function showModal(title, subtitle, titleColor) {
    modalTitle.innerText = title;
    modalTitle.style.color = titleColor;
    modalSubtitle.innerText = subtitle;
    gameModal.style.display = 'flex';
}

canvas.addEventListener('click', (e) => {
    if (gameStatus !== 'playing') return;
    if (flippedCards.length >= 2) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        if (mouseX >= card.x && mouseX <= card.x + card.width &&
            mouseY >= card.y && mouseY <= card.y + card.height) {
            
            if (!card.isFlipped && !card.isMatched) {
                card.isFlipped = true;
                flippedCards.push(card);
                
                if (flippedCards.length === 2) {
                    checkMatch();
                }
                draw();
            }
            break;
        }
    }
});

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.character === card2.character) {
        card1.isMatched = true;
        card2.isMatched = true;
        matchedPairs++;
        flippedCards = [];
        
        if (matchedPairs === 20) {
            gameStatus = 'victory';
            isContinuing = false;
            clearInterval(timerInterval);
            canvas.style.cursor = 'default';
            
            const timeTaken = 90 - timeRemaining;
            const minutesTaken = Math.floor(timeTaken / 60);
            const secondsTaken = timeTaken % 60;
            const timeFormatted = `${minutesTaken.toString().padStart(2, '0')}:${secondsTaken.toString().padStart(2, '0')}`;
            
            showModal('🏆 VITÓRIA! 🏆', `Vidas restantes: ${lives} | Tempo levado: ${timeFormatted}`, '#f1c40f');
        }
    } else {
        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            flippedCards = [];
            draw();
        }, 1000);
    }
}

restartBtn.addEventListener('click', initGame);

window.onload = initGame;
