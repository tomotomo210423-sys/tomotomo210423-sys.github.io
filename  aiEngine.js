let memory = [];
let difficultyLevel = "easy";

function setDifficulty(level){
    difficultyLevel = level;
}

function analyzePlayerInput(text){
    memory.push(text);

    let logical = text.includes("だから") || text.includes("つまり");
    let emotional = text.includes("好き") || text.includes("嫌い");

    let response = "";

    if(difficultyLevel === "easy"){
        response = "なるほど。でも別の考え方もありますよ。";
    }

    if(difficultyLevel === "normal"){
        if(logical){
            response = "論理的ですが、その前提は正しいですか？";
        } else {
            response = "感情だけでは証明になりません。";
        }
    }

    if(difficultyLevel === "hard"){
        if(memory.length > 1){
            response = "先ほどの発言と少し矛盾していませんか？";
        } else {
            response = "その主張の根拠を具体的に示してください。";
        }
    }

    return response;
}