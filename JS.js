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
// 假设已有的玩家数组是 players，每个元素包含 role (角色名), isBad (是否搞笑阵营) 等属性
// 假设 allGoodRoles 是所有相声阵营角色的名称数组
// 假设 allBadRoles 是所有搞笑阵营角色的名称数组

function generateDMSetupInfo(players, allGoodRoles, allBadRoles) {
    let setupHtml = "<h3>🎭 DM 开局专属提示信息（真实信息，无视混乱）</h3><ul style='line-height: 1.8;'>";

    // 1. 获取张寿臣/郭德纲的伪装身份 (3个不在场的相声阵营角色)
    const evilBoss = players.find(p => p.role === "张寿臣" || p.role === "郭德纲");
    if (evilBoss) {
        // 找出当前在场的相声角色
        const inPlayGoodRoles = players.filter(p => !p.isBad).map(p => p.role);
        // 筛选出不在场的相声角色
        const outOfPlayGoodRoles = allGoodRoles.filter(role => !inPlayGoodRoles.includes(role));
        
        // 随机抽取3个作为假身份 (打乱数组后取前3)
        const bluffs = outOfPlayGoodRoles.sort(() => 0.5 - Math.random()).slice(0, 3);
        setupHtml += `<li><b>【${evilBoss.role}】的假身份：</b>请告知他这三个不在场的好人身份：<span style="color: blue;">${bluffs.join("、")}</span></li>`;
    }

    // 2. 戴志诚信息：得知随机一名搞笑阵营角色在哪两名玩家之中
    const daiZhiCheng = players.find(p => p.role === "戴志诚");
    if (daiZhiCheng) {
        const badPlayers = players.filter(p => p.isBad);
        const randomBad = badPlayers[Math.floor(Math.random() * badPlayers.length)];
        
        const otherPlayers = players.filter(p => p !== randomBad && p.role !== "戴志诚");
        const randomOther = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        
        // 将两人位置打乱，防止固定顺序暴露谁是坏人
        const targetPair = [randomBad, randomOther].sort(() => 0.5 - Math.random());
        
        setupHtml += `<li><b>【戴志诚】信息位：</b>请告知他，搞笑阵营的 <span style="color: red;">${randomBad.role}</span> 在 【${targetPair[0].id}号】与【${targetPair[1].id}号】玩家之中。</li>`;
    }

    // 3. 师胜杰信息：左右各两名玩家里共有几位搞笑阵营玩家
    const shiShengJie = players.find(p => p.role === "师胜杰");
    if (shiShengJie) {
        const idx = players.indexOf(shiShengJie);
        const len = players.length;
        // 环形数组获取左右各两人
        const neighbors = [
            players[(idx - 1 + len) % len],
            players[(idx - 2 + len) % len],
            players[(idx + 1) % len],
            players[(idx + 2) % len]
        ];
        
        // 计算“视为”搞笑阵营的数量（需考虑大兵和赵本山的被动伪装）
        let badCount = 0;
        neighbors.forEach(p => {
            if (p.role === "大兵") {
                badCount++; // 大兵视为搞笑阵营
            } else if (p.role === "赵本山") {
                // 赵本山视为相声阵营，不加
            } else if (p.isBad) {
                badCount++;
            }
        });
        
        setupHtml += `<li><b>【师胜杰】信息位：</b>请告知他，他左右两边共4名玩家中，共有 <span style="color: red;">${badCount}</span> 位搞笑阵营玩家。</li>`;
    }

    // 4. 苏文茂信息：两名搞笑阵营和两名相声阵营，其中两人在场
    const suWenMao = players.find(p => p.role === "苏文茂");
    if (suWenMao) {
        // 在场的 1搞笑 1相声
        const inPlayBad = players.filter(p => p.isBad).map(p => p.role);
        const inPlayGood = players.filter(p => !p.isBad && p.role !== "苏文茂").map(p => p.role);
        
        // 不在场的 1搞笑 1相声
        const outPlayBad = allBadRoles.filter(role => !inPlayBad.includes(role));
        const outPlayGood = allGoodRoles.filter(role => !inPlayGood.includes(role) && role !== "苏文茂");
        
        const p1 = inPlayBad[Math.floor(Math.random() * inPlayBad.length)];
        const p2 = inPlayGood[Math.floor(Math.random() * inPlayGood.length)];
        const p3 = outPlayBad[Math.floor(Math.random() * outPlayBad.length)];
        const p4 = outPlayGood[Math.floor(Math.random() * outPlayGood.length)];
        
        const suInfoRoles = [p1, p2, p3, p4].sort(() => 0.5 - Math.random());
        setupHtml += `<li><b>【苏文茂】信息位：</b>请告知他这四个角色：【${suInfoRoles.join("、")}】。<br><i>（DM暗记：其中 ${p1} 和 ${p2} 是在场玩家）</i></li>`;
    }

    // 5. 高峰信息：需要DM动态交互
    const gaoFeng = players.find(p => p.role === "高峰");
    if (gaoFeng) {
        setupHtml += `<li><b>【高峰】信息位：</b>开局需等待高峰主动选择两名玩家，你需要告知他这两人的角色<br><i>（DM提示：至少告知一个正确的真实角色，你可以根据局势决定是否给一个假角色）。</i></li>`;
    }

    setupHtml += "</ul>";
    return setupHtml;
}
