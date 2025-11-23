const thoughts = [
    "To be slow one can be fast",
    "Stop focusing on others - focusing on yourself and fishing",
    "The internet is no less vast then the ocean, but that doesn't mean one has to be lost",
    "Pay attention to the present and wait",
    "The core of being antisocial is still being social, but in a destructive way instead of constructive.",
    "To stop spreading misfinformation, people should start fishing and do nothing",
    "Being responsible for oneself alone is the sign of maturity",
    "Things can be fake but still meaningful. Being beatiful is important then being true"
];

let thoughIndex = 0;

function showHookedThought(){
  let thought = thoughts[(thoughIndex + 1) % thoughts.length];
  showBubble(thought, { left: '30%', bottom: '80%' });
  thoughIndex += 1;
}

function showBubble(msg, pos){
  if(typeof textBubble === 'undefined' || !textBubble) return;
  textPersistent = true;
  textBubble.textContent = msg;
  textBubble.classList.remove('hidden');
  textBubble.style.opacity = '1';
  if(pos && pos.left) textBubble.style.left = pos.left;
  if(pos && pos.bottom) textBubble.style.bottom = pos.bottom;
}

function hideBubble(){
  if(typeof textBubble === 'undefined' || !textBubble) return;
  textPersistent = false;
  textBubble.style.opacity = '0';
  setTimeout(()=>{ if(textBubble) textBubble.classList.add('hidden'); }, 360);
}

const bobber = document.getElementById("bobber");
const fishLayer = document.getElementById("fishLayer");
const bubbleLayer = document.getElementById("bubbleLayer");
const textBubble = document.getElementById("textBubble");

let casted = false;
let hookOffset = 0; 
let hookTarget = null;
let hookSpeed = 1; 
let hookMaxOffset = 0;
let autoReelOnHookedFish = false;
let textPersistent = false;


function doCast(){
  if(casted){
    setHookTarget('up');
  } else {
 
    const tip = getHookTipCoords();
    hookMaxOffset = Math.max(0, window.innerHeight - 10 - tip.y);
    setHookTarget('down');
    makeTextBubble();
    makeBubbles();
  }
}

bobber.addEventListener("click", doCast);

window.addEventListener('keydown', (e) => {
  if(e.code === 'Space'){
    e.preventDefault();

    if(textPersistent){
      hideBubble();
      return;
    }
    if(hookTarget !== 'down'){
      hookMaxOffset = computeHookMaxOffset();
      setHookTarget('down');
    } else {
      setHookTarget('up');
    }
  }
});

function setHookTarget(t){
  if(t === 'down'){
    hookTarget = 'down';
    casted = true;
  } else if(t === 'up'){
    hookTarget = 'up';
    casted = false;
  } else {
    hookTarget = null;
  }
  
  bobber.style.transition = 'none';
}

function makeTextBubble(){
  const msg = thoughts[Math.floor(Math.random() * thoughts.length)];
  const x = 20 + Math.random()*50;
  const y = 40 + Math.random()*30;
  showPersistentBubble(msg, { left: x + '%', bottom: y + '%' });
}

function spawnFish(){
  const fish = document.createElement("img");


  fish.src = "assets/fish.png";
  fish.className = "fish";
  fish.style.position = "absolute";
  fish.style.left = "-10%";
  fish.style.bottom = (5 + Math.random()*50) + "%";
  fish.style.height = (40 + Math.random()*40) + "px";

  fish.style.transform = "scaleX(1)";

  fishLayer.appendChild(fish);

  const fishDuration = 50000 + Math.random()*10000;

  const anim = fish.animate([
    { left: "-10%" },
    { left: "110%" }
  ], {duration:fishDuration, easing:"linear"});

  fish._anim = anim;
  fish.dataset.hooked = "false";

  anim.onfinish = () => {
    if(fish.dataset.hooked !== "true") fish.remove();
  };
}

let fishInterval = 5000;

setInterval(spawnFish, fishInterval);
spawnFish();
setTimeout(spawnFish, 800);


function getHookTipCoords(){
  const hook = document.querySelector('#bobber .hook');
  if(!hook) return { x: -9999, y: -9999 };
  const rect = hook.getBoundingClientRect();
  
  return { x: rect.left + rect.width/2, y: rect.top + rect.height };
}

function updateHookTransform(){
  if(!bobber) return;
  bobber.style.transform = `translate(-50%, ${hookOffset}px)`;
}

function computeHookMaxOffset(){
  const tip = getHookTipCoords();
  return Math.max(0, window.innerHeight - 10 - tip.y);
}


function hookLoop(){
  if(hookTarget === 'down'){

    if(!hookMaxOffset) hookMaxOffset = computeHookMaxOffset();
    hookOffset = Math.min(hookOffset + hookSpeed, hookMaxOffset);
    updateHookTransform();
    if(hookOffset >= hookMaxOffset){
      hookTarget = null; 
    }
  } else if(hookTarget === 'up'){
    hookOffset = Math.max(hookOffset - hookSpeed, 0);
    updateHookTransform();
    if(hookOffset <= 0){
      
      hookTarget = null;
      hookMaxOffset = 0;
      
      if(autoReelOnHookedFish){
        showHookedThought();

        const hooked = Array.from(document.querySelectorAll('.fish[data-hooked="true"]'));
        hooked.forEach(f => {
          f.style.transition = 'opacity .36s ease, transform .36s ease';
          f.style.opacity = 0;
          f.style.transform = 'scale(0.85)';
          setTimeout(()=> f.remove(), 380);
        });
        autoReelOnHookedFish = false;
      }
    }
  }
  requestAnimationFrame(hookLoop);
}

requestAnimationFrame(hookLoop);

function collisionTick(){
  const hookTip = getHookTipCoords();
  const fishes = Array.from(document.querySelectorAll('.fish'));

  fishes.forEach(fish => {
    if(fish.dataset.hooked === 'true') return; 

    const fRect = fish.getBoundingClientRect();

    if(hookTip.x >= fRect.left && hookTip.x <= fRect.right &&
       hookTip.y >= fRect.top && hookTip.y <= fRect.bottom){

        fish.dataset.hooked = 'true';
        if(fish._anim && fish._anim.pause) fish._anim.pause();

     
      const layerRect = fishLayer.getBoundingClientRect();
      fish.style.left = (fRect.left - layerRect.left) + 'px';
      fish.style.top = (fRect.top - layerRect.top) + 'px';
      fish.style.bottom = 'auto';
      fish.style.transition = 'left .12s linear, top .12s linear';
    
      setHookTarget('up');
      autoReelOnHookedFish = true;
    }
  });

  
  const hooked = Array.from(document.querySelectorAll('.fish[data-hooked="true"]'));
  if(hooked.length){
    const layerRect = fishLayer.getBoundingClientRect();
    hooked.forEach(fish => {
      
      const targetX = getHookTipCoords().x - layerRect.left - (fish.getBoundingClientRect().width/2);
      const targetY = getHookTipCoords().y - layerRect.top - (fish.getBoundingClientRect().height*0.35);
      fish.style.left = targetX + 'px';
      fish.style.top = targetY + 'px';
    });
  }

  requestAnimationFrame(collisionTick);
}

requestAnimationFrame(collisionTick);
