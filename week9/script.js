const startBtn = document.getElementById('start-btn');
const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const quotePopup = document.getElementById('quote-popup');
const quoteText = document.getElementById('quote-text');

let seconds = 0;
let intervalId = null;
let totalTime = 60 * 60; 
let startBtnText = "Start Wasting Time";
let stopBtnText = "Stop Wasting Time";
let firstTimeMessage = "Unfortunately, you have no control on stopping the timmer - Try keep clicking.";
let secondTimeMessage = "Here are some thoughts and reflections."
let btnTimeCount = 0;

const messages = [
  "If computer is developing faster than the human mind, then cyborgs are the only solution",
  "'if you're not paying for the product, you are the product' - the only quote from the movie I found quite provoking",
  "Many online reviews considered this film to be 'manipulative' just like social media",
  "According to a book, a more intensive indoctrination could be the solution for a weaker one. So let's get indoctrinated to prepare us",
  "What responsility do people have for their own actions? Our weak humanity could be the cause for our addiction",
  "The goal of social media is to attract attenion. All it does achieving its goal and it is the users who are ignorant",
  "'To prefer one bit of media over another — to have taste — is a characteristic developed with maturity' By Helen Holmes at New York Times",
  "If social media is offering us great emotion attachment that we can't find in real life then we should admit that - only by knowing that it is fake it could be more good in real",
  "For seeking information, watch a documententry, For seeking excitement and emotional pleasure, watch a drama. A docudrama failed at both",
  "The piano cue in the background sounds very obnoxious. It fits well for the film."
];

function pad(num) {
  return num.toString().padStart(2, '0');
}

function updateTimer() {
  seconds++;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerEl.textContent = `${pad(mins)}:${pad(secs)}`;

  const percent = (seconds / totalTime) * 100;
  progressBar.style.width = Math.min(percent, 100) + '%';

  if (seconds >= totalTime) {
    setTimeout(resetTimer, 1000);
    startBtn.textContent = startBtnText;
  }
}

function resetTimer(){
    clearInterval(intervalId);
    intervalId = null;
    timerEl.textContent = "00:00";
    progressBar.style.width = '0%';
}

function showQuote() {
  const message = messages[Math.floor(Math.random() * messages.length)];
  if (quoteText) quoteText.textContent = message;
  quotePopup.style.display = 'flex';
}

startBtn.addEventListener('click', () => {
  if (intervalId === null) {
    seconds = 0;
    timerEl.textContent = "00:00";
    progressBar.style.width = '0%';
    intervalId = setInterval(updateTimer, 1000);
    startBtn.textContent = stopBtnText;
  } else {
    if (btnTimeCount == 0) {
        if (quoteText) quoteText.textContent = firstTimeMessage;
        quotePopup.style.display = 'flex';
        
    } else if (btnTimeCount == 1) {
        if (quoteText) quoteText.textContent = secondTimeMessage;
        quotePopup.style.display = 'flex';
    } 
    else {
        showQuote();
    }
    btnTimeCount += 1;
  }
});

quotePopup.addEventListener('click', (e) => {
    quotePopup.style.display = 'none';
});


