let body = document.querySelector("body");
let main = document.querySelector("main");

let theButton = document.querySelector("button");
theButton.style.border = "10px solid black";
theButton.addEventListener("click", theyClicked);

let picturesContainer = document.querySelector(".picture-container");
let pictures = Array.from(picturesContainer.children);

let count = 0;
let countThreshold = 100;
let counter = document.querySelector("#counter");

function theyClicked(event){
    count += 1;

    if (count == countThreshold) {
        console.log("You did it!");
        addNewElements(event);
    }

    picturesContainer.innerHTML = "";
    pictures.sort(() => Math.random() - 0.5).forEach(picture => picturesContainer.appendChild(picture));
    counter.textContent = "You have clicked " + String(count) + (" times");
}

function addNewElements(event){
    let audio = document.createElement("audio");
    audio.src = "background1.mp3"; 
    audio.autoplay = true; 
    audio.loop = true;
    
    document.body.appendChild(audio);
    audio.pause();

    let newButton = document.createElement("button");
    newButton.textContent = "You have discovered the new button";
    newButton.style.border = "10px solid black";
    newButton.addEventListener("click",performTransformation);
    main.appendChild(newButton);
}

function performTransformation(event) {
    let audio = document.querySelector("audio");
    audio.play();

    let discoBall = document.createElement("img");
    //https://commons.wikimedia.org/wiki/File:DiscoBall3.gif
    //Sami Väätänen, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons
    discoBall.src = "DiscoBall3.gif"; 
    discoBall.width = "80%";
    discoBall.setAttribute("class", "discoBall");
    discoBall.style = "";
    picturesContainer.innerHTML = null;
    picturesContainer.appendChild(discoBall);
}
