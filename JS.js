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
        let p = new Player(i);
        p.isConfused = false; // 新增：初始化每个玩家为清醒状态
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
    comedyState = [comedyNum, comedyNum, 0, 0]; 
    funnyState = [funnyNum+1, funnyNum+1, 0, 0]; 
    setGameState();

    // 渲染整合了连坐公告和战力平衡的 DM 专属提示板
    document.getElementById("gameInfo").innerHTML = generateDMSetupInfo();
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

// ==========================================
// 核心模块：DM 提示面板生成（包含战力评估与连坐计算）
// ==========================================
function generateDMSetupInfo() {
    let setupHtml = "<div style='border: 2px solid #333; padding: 15px; border-radius: 8px; background-color: #fafafa; margin-top: 15px;'>";
    setupHtml += "<h3 style='text-align:center; color:#333; margin-top:0;'>🎭 DM 开局专属提示信息板</h3>";

    // ------------------------------------------
    // 0. 全局公告：连坐信息（还原保留你的规则）
    // ------------------------------------------
    let adjacentBadCount = 0;
    // 提前拿到圆桌末位玩家，用于和0号玩家比较
    let last = playersList[playerNum - 1];
    let lastIsBad = (last.name === "大兵" || (last.party === 1 && last.name !== "赵本山"));
    
    for(let i = 0; i < playerNum; i++) {
        let p = playersList[i];
        let currentIsBad = (p.name === "大兵" || (p.party === 1 && p.name !== "赵本山"));
        if (lastIsBad && currentIsBad) {
            adjacentBadCount++;
        }
        lastIsBad = currentIsBad;
    }

    setupHtml += `<div style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #90caf9;">
        <strong>📢 全局公告 (白天公布)：</strong> 场上存在 <b style="color:red; font-size:1.2em;">${adjacentBadCount}</b> 对相邻搞笑阵营。<br>
    </div>`;

    // ------------------------------------------
    // 1. 战力评估系统 (三档动态调节)
    // ------------------------------------------
    const strongGoodRoles = ["戴志诚", "师胜杰", "苏文茂", "高峰", "侯宝林", "侯耀文", "马季"];
    const strongBadRoles = ["曹云金", "赵本山", "椅子带王"];

    let H = playersList.filter(p => p.party === 0 && strongGoodRoles.includes(p.name) && !p.isConfused).length;
    let W = playersList.filter(p => p.party === 1 && strongBadRoles.includes(p.name)).length;

    let gameBalanceState, balanceMessage;

    if (H <= W) {
        gameBalanceState = "WOLF_STRONG";
        balanceMessage = "<span style='color: #d32f2f; font-weight:bold;'>【狼队强势】</span> 强行锁定信息靶子，发放<b>高交叉有效信息</b>。";
    } else if (H >= W + 3) {
        gameBalanceState = "HUMAN_STRONG";
        balanceMessage = "<span style='color: #1976d2; font-weight:bold;'>【好人强势】</span> 发放<b>干扰/废信息</b>平衡局势，保护狼队。";
    } else {
        gameBalanceState = "BALANCED";
        balanceMessage = "<span style='color: #388e3c; font-weight:bold;'>【势均力敌】</span> 将发放<b>正常随机信息</b>，不作干预。";
    }

    setupHtml += `<div style="background-color: #fff; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px dashed #ccc; text-align: left;">
        <strong>📊 后台战力探测：</strong> 相声清醒强神 <b>${H}</b> 名 vs 搞笑强力角色 <b>${W}</b> 名<br>
        <strong>⚖️ 局势判定：</strong> ${balanceMessage}
    </div>`;

    // ------------------------------------------
    // 2. 选取信息靶子
    // ------------------------------------------
    const smallWolves = playersList.filter(p => p.party === 1 && p.name !== "张寿臣");
    const daBing = playersList.find(p => p.name === "大兵");
    
    let targetBadPlayer = null;
    if (gameBalanceState === "WOLF_STRONG" && smallWolves.length > 0) {
        targetBadPlayer = smallWolves[Math.floor(Math.random() * smallWolves.length)];
    } else if (gameBalanceState === "HUMAN_STRONG") {
        targetBadPlayer = daBing ? daBing : (smallWolves[Math.floor(Math.random() * smallWolves.length)] || playersList.find(p => p.party === 1));
    }

    setupHtml += "<ul style='line-height: 1.8; padding-left: 20px; text-align: left;'>";

    // 用于计算不在场身份的全局池子
    const allGoodRolesList = allRoles.filter(r => rolesPartyDict[r] === 0);
    const allBadRolesList = allRoles.filter(r => rolesPartyDict[r] === 1);

    // ------------------------------------------
    // 3. 角色信息结算
    // ------------------------------------------
    
    // (1) 张寿臣的假身份
    const zhangShouChen = playersList.find(p => p.name === "张寿臣");
    if (zhangShouChen) {
        const inPlayGoodRoles = playersList.filter(p => p.party === 0).map(p => p.name);
        const outOfPlayGoodRoles = allGoodRolesList.filter(role => !inPlayGoodRoles.includes(role));
        const bluffs = outOfPlayGoodRoles.sort(() => 0.5 - Math.random()).slice(0, 3);
        setupHtml += `<li><b>【张寿臣】的假身份：</b>请告知三个不在场好人：<span style="color: blue; font-weight:bold;">${bluffs.join("、") || "无可用"}</span></li>`;
    }

    // (2) 戴志诚
    const daiZhiCheng = playersList.find(p => p.name === "戴志诚");
    if (daiZhiCheng) {
        if (daiZhiCheng.isConfused) {
            const targetPair = playersList.filter(p => p.party === 0 && p.name !== "戴志诚").sort(() => 0.5 - Math.random()).slice(0, 2);
            const fakeBadRole = allBadRolesList[Math.floor(Math.random() * allBadRolesList.length)];
            setupHtml += `<li><b>【戴志诚】<span style="color: purple;">(已混乱)</span>：</b>假信息：搞笑阵营的 <span style="color: red;">${fakeBadRole}</span> 在 【${(targetPair[0]?.num + 1) || '?'}号】与【${(targetPair[1]?.num + 1) || '?'}号】之中。</li>`;
        } else {
            let actualBadPlayer = targetBadPlayer;
            if (gameBalanceState === "BALANCED" && smallWolves.length > 0) {
                actualBadPlayer = smallWolves[Math.floor(Math.random() * smallWolves.length)];
            } else if (!actualBadPlayer) {
                actualBadPlayer = playersList.find(p => p.party === 1);
            }
            
            if (actualBadPlayer) {
                let otherPlayerList = playersList.filter(p => p.num !== actualBadPlayer.num && p.name !== "戴志诚");
                if (gameBalanceState === "WOLF_STRONG") {
                    const knownGood = otherPlayerList.filter(p => p.party === 0 && p.name !== "大兵");
                    if (knownGood.length > 0) otherPlayerList = knownGood;
                }
                const otherPlayer = otherPlayerList[Math.floor(Math.random() * otherPlayerList.length)];
                const targetPair = [actualBadPlayer, otherPlayer].filter(Boolean).sort(() => 0.5 - Math.random());
                setupHtml += `<li><b>【戴志诚】(清醒)：</b>真信息：搞笑阵营的 <span style="color: red;">${actualBadPlayer.name}</span> 在 【${targetPair[0].num + 1}号】与【${targetPair[1].num + 1}号】之中。</li>`;
            }
        }
    }

    // (3) 苏文茂
    const suWenMao = playersList.find(p => p.name === "苏文茂");
    if (suWenMao) {
        if (suWenMao.isConfused) {
            const allInPlayRoles = playersList.filter(p => p.name !== "苏文茂").map(p => p.name);
            const allOutPlayRoles = allRoles.filter(r => !allInPlayRoles.includes(r) && r !== "苏文茂");
            const fakeP1 = allInPlayRoles[Math.floor(Math.random() * allInPlayRoles.length)];
            const fakeOutRoles = allOutPlayRoles.sort(() => 0.5 - Math.random()).slice(0, 3);
            const fakeRoles = [fakeP1, ...fakeOutRoles].filter(Boolean).sort(() => 0.5 - Math.random());
            setupHtml += `<li><b>【苏文茂】<span style="color: purple;">(已混乱)</span>：</b>假信息：告知这四个角色【${fakeRoles.join("、")}】。<br><span style="color: #666; font-size: 0.9em;"><i>（DM暗记：实际上只有 ${fakeP1} 1人在场，打破规则）</i></span></li>`;
        } else {
            let p1 = targetBadPlayer ? targetBadPlayer.name : null;
            if (gameBalanceState === "BALANCED" && smallWolves.length > 0) {
                p1 = smallWolves[Math.floor(Math.random() * smallWolves.length)].name;
            } else if (!p1) {
                const badList = playersList.filter(p => p.party === 1);
                p1 = badList.length > 0 ? badList[0].name : "未知";
            }

            const inPlayGoodList = playersList.filter(p => p.party === 0 && p.name !== "苏文茂" && p.name !== p1);
            let p2 = inPlayGoodList.length > 0 ? inPlayGoodList[Math.floor(Math.random() * inPlayGoodList.length)].name : "未知";

            const inPlayRoles = playersList.map(p => p.name);
            const outPlayBadList = allBadRolesList.filter(r => !inPlayRoles.includes(r));
            const outPlayGoodList = allGoodRolesList.filter(r => !inPlayRoles.includes(r));
            
            let p3 = outPlayBadList.length > 0 ? outPlayBadList[Math.floor(Math.random() * outPlayBadList.length)] : "未知";
            let p4 = outPlayGoodList.length > 0 ? outPlayGoodList[Math.floor(Math.random() * outPlayGoodList.length)] : "未知";

            const suInfoRoles = [p1, p2, p3, p4].filter(r => r !== "未知").sort(() => 0.5 - Math.random());
            
            setupHtml += `<li><b>【苏文茂】(清醒)：</b>真信息：告知这四个角色【${suInfoRoles.join("、")}】。<br><span style="color: #666; font-size: 0.9em;"><i>（DM暗记：在场的是 ${p1} 和 ${p2}。</i></span>`;
            if (gameBalanceState === "WOLF_STRONG") setupHtml += `<span style="color: #c62828; font-size: 0.9em; font-weight:bold;"><i>因扶持好人，此信息必定与戴志诚交叉指向 ${p1}）</i></span></li>`;
            else setupHtml += `</li>`;
        }
    }

    // (4) 师胜杰
    const shiShengJie = playersList.find(p => p.name === "师胜杰");
    if (shiShengJie) {
        const idx = playersList.indexOf(shiShengJie);
        const len = playersList.length;
        const neighbors = [
            playersList[(idx - 1 + len) % len], playersList[(idx - 2 + len) % len],
            playersList[(idx + 1) % len], playersList[(idx + 2) % len]
        ];
        
        let realBadCount = 0;
        neighbors.forEach(p => {
            if (p.name === "大兵" || (p.party === 1 && p.name !== "赵本山")) realBadCount++;
        });

        if (shiShengJie.isConfused) {
            let fakeCounts = [0, 1, 2, 3, 4].filter(num => num !== realBadCount);
            let fakeCount = fakeCounts[Math.floor(Math.random() * fakeCounts.length)];
            setupHtml += `<li><b>【师胜杰】<span style="color: purple;">(已混乱)</span>：</b>假信息：请告诉他错误数字 <span style="color: red; font-size: 1.2em; font-weight: bold;">${fakeCount}</span>。</li>`;
        } else {
            setupHtml += `<li><b>【师胜杰】(清醒)：</b>真信息：请告诉他真实数字 <span style="color: red; font-weight: bold;">${realBadCount}</span>。</li>`;
        }
    }

    // (5) 高峰
    const gaoFeng = playersList.find(p => p.name === "高峰");
    if (gaoFeng) {
        if (gaoFeng.isConfused) {
            setupHtml += `<li><b>【高峰】<span style="color: purple;">(已混乱)</span>：</b>假信息：无论他选谁，全部告知<b>错误</b>的角色名。</li>`;
        } else {
            setupHtml += `<li><b>【高峰】(清醒)：</b>真信息：开局等待他选择。至少告知其中一人<b>正确</b>的真实角色。</li>`;
        }
    }

    setupHtml += "</ul></div>";
    return setupHtml;
}
