let memory = [];
let difficultyLevel = "easy";

function setDifficulty(level){
    difficultyLevel = level;
}

function analyzePlayerInput(text){

    if(!text) return "何か主張してください。";

    memory.push(text);

    let logical = text.includes("だから") || text.includes("つまり");
    let emotional = text.includes("好き") || text.includes("嫌い");

    if(difficultyLevel === "easy"){
        return "なるほど。でも別の考え方もありますよ。";
    }

    if(difficultyLevel === "normal"){
        if(logical){
            return "論理的ですが、その前提は本当に正しいですか？";
        }
        if(emotional){
            return "感情だけでは証明になりません。";
        }
        return "もう少し具体的に説明できますか？";
    }

    if(difficultyLevel === "hard"){
        if(memory.length > 1){
            return "先ほどの発言と整合性が取れていない可能性があります。";
        }
        return "その主張の根拠を具体的に提示してください。";
    }

    return "興味深いですね。";
}