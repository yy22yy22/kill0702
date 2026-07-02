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

        content += "<div style = '";
        content += "left: calc(" + (Math.sin(arc*i) * playerNum / 9) + " * 25% + 50% - 1.75rem); ";
        content += "top: calc(" + (Math.cos(arc*i) * playerNum / 9) + " * 25% + 50% - 1.75rem); ";
        content += "background: " + alivenessColour[p.aliveness] + "; ";
        content += "color: " + backgroundColour[p.party] + "; ";
        content += "' class='playerAvatar'>";
        content += p.name + "</div>";
    }
    chart.innerHTML = content;
}

function distributeRoles(){
    let tempPlayerList = [];

    let boss = Math.floor((Math.random()*playerNum));
    tempPlayerList.push(boss);
    playersList[boss].setRole(new Role("张寿臣"));
    roleAndPlayerDic["张寿臣"] = playersList[boss];

    distributeRolesWithDetails(funnyNum, funnyRoles, tempPlayerList);

    let lowBias, highBias, clownBias;
    let lowNum,  highNum,  clownNum;

    do {
        highBias = Math.random() * (2 / comedyNum) - (1 / comedyNum);
        lowBias = Math.random() * (2 / comedyNum) - (1 / comedyNum);
        clownBias = - (lowBias + highBias);
        highNum = Math.round(comedyNum * (highRate + highBias));
        lowNum = Math.round(comedyNum * (lowRate + lowBias));
        clownNum = Math.round(comedyNum * (clownRate + clownBias));
    } while (highNum < 1 || highNum > highComedyRoles.length
        || lowNum < 0 || lowNum > lowComedyRoles.length
        || clownNum < 0 || clownNum > clownComedyRoles.length);

    if (highNum + lowNum + clownNum != comedyNum){
        clownNum -= (highNum + lowNum + clownNum - comedyNum);
    }
    
    tempPlayerList = distributeRolesWithDetails(highNum, highComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(lowNum, lowComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(clownNum, clownComedyRoles, tempPlayerList);
}

function distributeRolesWithDetails(roleNum, roles, tempPlayerList){
    let tempList = [];
    for (let i = 0; i < roleNum; i ++){
        let index;
        do{ 
            index = Math.floor((Math.random()*roles.length));
        } while (tempList.indexOf(index) != -1);
        tempList.push(index);

        let role = new Role(roles[index]);
        
        do{ 
            index = Math.floor((Math.random()*playerNum));
        } while (tempPlayerList.indexOf(index) != -1);
        tempPlayerList.push(index);

        playersList[index].setRole(role);
        roleAndPlayerDic[role] = playersList[index];
    }
    return tempPlayerList;
}

function displayTable(){
    let button = document.getElementById("displayTable");
    button.innerHTML = tableDisplayed ? "展示当前桌面" : "收起当前桌面";
    let chart = document.getElementById("playerTableWindow");
    chart.hidden = tableDisplayed;
    if (!tableDisplayed) {
        drawTabletop();
    }
    tableDisplayed = !tableDisplayed;
}

function drawStatusDiagram(){
    let table = document.getElementById("tableDiv");
    let changeList = "<option value='' selected='true'>不修改</option>";

    for (let i = 0; i < allRoles.length; i ++){
        if(roleAndPlayerDic[allRoles[i]] == undefined){
            changeList += "<option value='" + allRoles[i] + "'>";
