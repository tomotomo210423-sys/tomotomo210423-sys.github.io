let playerHP = 100;
let aiHP = 100;
let support = 50;

document.addEventListener("DOMContentLoaded", function(){

    const startBtn = document.getElementById("startBtn");
    const sendBtn = document.getElementById("sendBtn");

    startBtn.addEventListener("click", startGame);
    sendBtn.addEventListener("click", sendMessage);

});

function startGame(){

    const name = document.getElementById("playerName").value.trim();
    const difficulty = document.getElementById("difficulty").value;

    if(!name){
        alert("名前を入力してください");
        return;
    }

    setDifficulty(difficulty);

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");

    addMessage("system", name + " の討論が始まった！");
}

function sendMessage(){

    const input = document.getElementById("playerInput");
    const text = input.value.trim();

    if(!text) return;

    addMessage("player", text);

    const aiResponse = analyzePlayerInput(text);
    addMessage("ai", aiResponse);

    calculateDamage();

    input.value = "";
}

function calculateDamage(){

    let damage = Math.floor(Math.random() * 10) + 5;
    aiHP -= damage;

    support += Math.floor(Math.random() * 5);

    if(aiHP < 0) aiHP = 0;
    if(support > 100) support = 100;

    updateStatus();

    if(aiHP === 0){
        addMessage("system", "あなたの勝利！");
    }
}

function updateStatus(){
    document.getElementById("playerHP").textContent = playerHP;
    document.getElementById("aiHP").textContent = aiHP;
    document.getElementById("support").textContent = support;
}

function addMessage(type, text){

    const box = document.getElementById("chatBox");
    const div = document.createElement("div");

    if(type === "player") div.style.color = "cyan";
    if(type === "ai") div.style.color = "orange";
    if(type === "system") div.style.color = "lime";

    div.textContent = text;
    box.appendChild(div);

    box.scrollTop = box.scrollHeight;
}