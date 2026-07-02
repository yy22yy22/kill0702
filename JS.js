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

function init(){
    playersList = [];
    roleAndPlayerDic = {};
    document.getElementById("initialWindow").hidden = false;
    document.getElementById("gameWindow").hidden = true;
    playerNum = parseInt(document.getElementById("PlayerNumber").value);
    for (let i = 0; i < playerNum; i++){
        playersList.push(new Player(i));
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

    // 分配张寿臣
    let boss = Math.floor((Math.random()*playerNum));
    tempPlayerList.push(boss);
    playersList[boss].setRole(new Role("张寿臣"));
    roleAndPlayerDic["张寿臣"] = playersList[boss];

    // 分配搞笑阵营
    distributeRolesWithDetails(funnyNum, funnyRoles, tempPlayerList);

    let lowBias, highBias, clownBias;
    let lowNum,  highNum,  clownNum;

    // 生成三个随机bias，范围是(-1/comedyNum, 1/comedyNum)，保证三个之和为0
    // 还要保证强神数大于1
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

    // 修正人数
    if (highNum + lowNum + clownNum != comedyNum){
        clownNum -= (highNum + lowNum + clownNum - comedyNum);
    }
    tempPlayerList = distributeRolesWithDetails(highNum, highComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(lowNum, lowComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(clownNum, clownComedyRoles, tempPlayerList);
}

// roleNum: int             待分配角色数
// roles: String[]          分配角色表（从全局角色表里选）
// tempPlayerList: int[]    记录了已分配过角色的玩家的序号的表
// party: int               1狼 0民
function distributeRolesWithDetails(roleNum, roles, tempPlayerList){
    let tempList = [];
    for (let i = 0; i < roleNum; i ++){
        let index;
        do{ // 抽角色
            index = Math.floor((Math.random()*roles.length));
        } while (tempList.indexOf(index) != -1);
        tempList.push(index);

        let role = new Role(roles[index]);
        
        do{ // 抽玩家
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
            changeList += allRoles[i] + "</option>";
        }
    }

    let content = "<table style='width: 90%;table-layout:fixed;'>";
    content += "<tr><th>玩家</th><th>身份</th><th>阵营</th><th></th></tr>";
    for (let i = 0; i < playerNum; i++){
        let p = playersList[i];
        content += "<tr>";
        content += "<td>" + (p.num + 1) + "</td>";
        content += "<td>" + p.name + "</td>";
        content += "<td>" + (p.party == 1 ? "搞笑" : "相声") + "</td>";
        content += "<td><select onchange='changeRole(" + i + ", this.value)'>";
        content += changeList + "</select></td>";
        content += "</tr>";
    }
    content += "</table>";
    table.innerHTML = content;
}

function changeRole(num, name){
    let player = playersList[num];
    if (rolesPartyDict[name] == 1){
        funnyNum ++;
    } else {
        comedyNum ++;
    }
    if (player.party == 1){
        funnyNum --;
    } else {
        comedyNum --;
    }

    delete roleAndPlayerDic[player.name];
    let role = new Role(name);
    player.setRole(role);
    roleAndPlayerDic[name] = player;
    document.getElementById("comedyNumRegion").innerHTML = comedyNum;
    document.getElementById("funnyNumRegion").innerHTML  = funnyNum+1;
    drawStatusDiagram();
}

function beginNightZero(){
    document.getElementById("gameWindow").hidden = false;
    document.getElementById("initialWindow").hidden = true;
    comedyState = [comedyNum, comedyNum, 0, 0]; // 总，在场，下场，死
    funnyState = [funnyNum+1, funnyNum+1, 0, 0]; 
    setGameState();

    let content = "";
    let notice = giveNoticeBoard();
    content += "公告板：场上存在" + notice + "对相邻搞笑阵营。<br>";

    document.getElementById("gameInfo").innerHTML = content;
}

function setGameState(){
    document.getElementById("comedyTotal").innerHTML = comedyState[0];
    document.getElementById("comedyOn").innerHTML = comedyState[1];
    document.getElementById("comedyOff").innerHTML = comedyState[2];
    document.getElementById("comedyOut").innerHTML = comedyState[3];
    document.getElementById("funnyTotal").innerHTML = funnyState[0];
    document.getElementById("funnyOn").innerHTML = funnyState[1];
    document.getElementById("funnyOff").innerHTML = funnyState[2];
    document.getElementById("funnyOut").innerHTML = funnyState[3];
}

function giveNoticeBoard(){
    let result = 0;
    let last = playersList[playerNum-1].party;
    for(let i = 0; i < playerNum; i ++){
        let now;
        if (playersList[i].name == "大兵"){
            now = 1;
        } else if (playersList[i].name == "赵本山"){
            now = 0;
        } else {
            now = playersList[i].party;
        }
        if (last == 1 && now == last){
            result ++;
        }
        last = now;
    }
    return result;
}
