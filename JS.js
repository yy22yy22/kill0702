"use strict";

let ROUND = 0;
let playerNum = 0;

let tableDisplayed = false;

let playersList = [];
let roleAndPlayerDic = {};

const lowRate = 0.21/0.7;
const highRate = 0.24/0.7;
const clownRate = 0.25/0.7;

let comedyNum;
let funnyNum;

let comedyState = [];
let funnyState = [];

let gameStart = false;

// ==========================================
// 辅助函数：判定角色在游戏里“被视为”什么阵营
// ==========================================
function isSeenAsBad(roleName) {
    if (!roleName) return false;
    if (roleName === "大兵") return true;       // 大兵视为搞笑
    if (roleName === "赵本山") return false;     // 赵本山视为相声
    return rolesPartyDict[roleName] === 1;      // 其他人看真实阵营
}

function isSeenAsGood(roleName) {
    if (!roleName) return false;
    return !isSeenAsBad(roleName);
}

function init(){
    playersList = [];
    roleAndPlayerDic = {};
    document.getElementById("initialWindow").hidden = false;
    document.getElementById("gameWindow").hidden = true;
    playerNum = parseInt(document.getElementById("PlayerNumber").value);
    
    for (let i = 0; i < playerNum; i++){
        let p = new Player(i);
        p.isConfused = false; // 初始化清醒状态
        p.fakeRole = null;    // 初始化明面假身份（用于刘云天、张伯鑫）
        playersList.push(p);
    }
    
    funnyNum = (playerNum < 11) ? 2 : 3;
    comedyNum = playerNum - funnyNum - 1;
    distributeRoles();
    document.getElementById("comedyNumRegion").innerHTML = comedyNum;
    document.getElementById("funnyNumRegion").innerHTML  = funnyNum+1;

    drawStatusDiagram();
    if (tableDisplayed){
        displayTable();
    }
}

function drawTabletop(){
    let content = "";
    let chart = document.getElementById("playerChart");
    let arc = 2 * Math.PI / playerNum;
    for (let i = 0; i < playerNum; i++){
        let p = playersList[i];
        content += "<div style = '";
        content += "left: calc(" + Math.sin(arc*i) + " * (" + playerNum / 9;
        content += " * 25% - 2.5rem) + 50% - 1rem); ";
        content += "top: calc(" + Math.cos(arc*i) + " * (" + playerNum / 9;
        content += " * 25% - 2.5rem) + 50% - 1rem); ";
        content += "background: " + backgroundColour[p.party] + "; ";
        content += "' class='playerNumber'>";
        content += (i+1) + "</div>";
