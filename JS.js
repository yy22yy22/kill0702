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
            allRoles[i] + "</option>";
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
.getElementById("funnyNumRegion").innerHTML  = funnyNum+1;
    drawStatusDiagram();
}

function beginNightZero(){
    document.getElementById("gameWindow").hidden = false;
    document.getElementById("initialWindow").hidden = true;
    comedyState = [comedyNum, comedyNum, 0, 0]; 
    funnyState = [funnyNum+1, funnyNum+1, 0, 0]; 
    setGameState();

    // 在生成面板前，先结算分配刘云天与张伯鑫的明面假身份
    assignSpecialFakeRoles();

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
// 新增：为刘云天、张伯鑫分配初始明面身份
// ==========================================
function assignSpecialFakeRoles() {
    const inPlayRoles = playersList.map(p => p.name);
    const outPlayRoles = allRoles.filter(r => !inPlayRoles.includes(r));
    const outPlayGoodRoles = outPlayRoles.filter(r => rolesPartyDict[r] === 0);
    
    let liu = playersList.find(p => p.name === "刘云天");
    if (liu && !liu.fakeRole) {
        // 刘云天：一定被发的是不在场角色 (最好是好人神职以增加干扰)
        if (outPlayGoodRoles.length > 0) {
            liu.fakeRole = outPlayGoodRoles[Math.floor(Math.random() * outPlayGoodRoles.length)];
        } else {
            liu.fakeRole = outPlayRoles[Math.floor(Math.random() * outPlayRoles.length)] || "无";
        }
    }

    let zhang = playersList.find(p => p.name === "张伯鑫");
    if (zhang && !zhang.fakeRole) {
        // 张伯鑫：可以被发在场的狼角色 (混合池：不在场好人 + 在场狼队)
        const inPlayBadRoles = playersList.filter(p => p.party === 1).map(p => p.name);
        let candidates = [...outPlayGoodRoles, ...inPlayBadRoles];
        if (candidates.length > 0) {
            zhang.fakeRole = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            zhang.fakeRole = "无";
        }
    }
}

// ==========================================
// 核心模块：DM 提示面板生成
// ==========================================
function generateDMSetupInfo() {
    let setupHtml = "<div style='border: 2px solid #333; padding: 15px; border-radius: 8px; background-color: #fafafa; margin-top: 15px;'>";
    setupHtml += "<h3 style='text-align:center; color:#333; margin-top:0;'>🎭 DM 开局专属提示信息板</h3>";

    // 0. 全局公告：连坐信息
    let adjacentBadCount = 0;
    let lastIsBad = isSeenAsBad(playersList[playerNum - 1].name);
    for(let i = 0; i < playerNum; i++) {
        let currentIsBad = isSeenAsBad(playersList[i].name);
        if (lastIsBad && currentIsBad) adjacentBadCount++;
        lastIsBad = currentIsBad;
    }

    setupHtml += `<div style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #90caf9;">
        <strong>📢 全局公告 (白天公布)：</strong> 场上存在 <b style="color:red; font-size:1.2em;">${adjacentBadCount}</b> 对相邻搞笑阵营。<br>
    </div>`;

    // 1. 战力评估系统与刘云天/张伯鑫战力惩罚结算
    const strongGoodRoles = ["戴志诚", "师胜杰", "苏文茂", "高峰", "侯宝林", "侯耀文", "马季"];
    const strongBadRoles = ["曹云金", "赵本山", "椅子带王"];
    const infoRoles = ["戴志诚", "苏文茂", "师胜杰", "高峰"];

    let H = playersList.filter(p => isSeenAsGood(p.name) && strongGoodRoles.includes(p.name) && !p.isConfused).length;
    let W = playersList.filter(p => p.party === 1 && strongBadRoles.includes(p.name)).length;

    // 引入负面影响判定：每出现一种负面状态，好人强力战力 H 减 0.5
    let liu = playersList.find(p => p.name === "刘云天");
    if (liu && infoRoles.includes(liu.fakeRole)) {
        H -= 0.5; // 刘云天被发到信息位假身份
    }

    let zhang = playersList.find(p => p.name === "张伯鑫");
    if (zhang && rolesPartyDict[zhang.fakeRole] === 1 && zhang.fakeRole !== "曹云金" && zhang.fakeRole !== "卓别林") {
        H -= 0.5; // 张伯鑫被发到除曹云金、卓别林外不易察觉的狼队角色
    }

    let gameBalanceState, balanceMessage;
    if (H <= W) {
        gameBalanceState = "WOLF_STRONG";
        balanceMessage = "<span style='color: #d32f2f; font-weight:bold;'>【狼队强势】</span> 发放<b>高交叉有效信息</b>。";
    } else if (H >= W + 3) {
        gameBalanceState = "HUMAN_STRONG";
        balanceMessage = "<span style='color: #1976d2; font-weight:bold;'>【好人强势】</span> 发放<b>干扰/废信息</b>保护狼队。";
    } else {
        gameBalanceState = "BALANCED";
        balanceMessage = "<span style='color: #388e3c; font-weight:bold;'>【势均力敌】</span> 发放<b>正常随机信息</b>。";
    }

    setupHtml += `<div style="background-color: #fff; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px dashed #ccc; text-align: left;">
        <strong>📊 战力探测：</strong> 相声有效清醒战力 <b>${H}</b> vs 搞笑强力 <b>${W}</b><br>
        <strong>⚖️ 局势判定：</strong> ${balanceMessage}
    </div>`;

    // 2. 选取信息靶子
    const realSmallWolvesInPlay = playersList.filter(p => p.party === 1 && p.name !== "张寿臣" && p.name !== "赵本山");
    const daBing = playersList.find(p => p.name === "大兵");
    
    let targetBadPlayer = null;
    if (gameBalanceState === "WOLF_STRONG" && realSmallWolvesInPlay.length > 0) {
        targetBadPlayer = realSmallWolvesInPlay[Math.floor(Math.random() * realSmallWolvesInPlay.length)];
    } else if (gameBalanceState === "HUMAN_STRONG") {
        targetBadPlayer = daBing ? daBing : (realSmallWolvesInPlay[Math.floor(Math.random() * realSmallWolvesInPlay.length)] || playersList.find(p => isSeenAsBad(p.name)));
    }

    setupHtml += "<ul style='line-height: 1.8; padding-left: 20px; text-align: left;'>";

    const seenAsBadRoles = allRoles.filter(isSeenAsBad);
    const seenAsGoodRoles = allRoles.filter(isSeenAsGood);

    // 3. 角色信息结算
    
    // (1) 播报刘云天、张伯鑫的明面身份
    if (liu) {
        setupHtml += `<li><b>【刘云天】开局明面身份：</b>告知他他以为自己是 <span style="color: blue;">${liu.fakeRole}</span>。<i>（DM暗记：必定为不在场身份）</i></li>`;
    }
    if (zhang) {
        let color = rolesPartyDict[zhang.fakeRole] === 1 ? "red" : "blue";
        setupHtml += `<li><b>【张伯鑫】开局明面身份：</b>告知他他以为自己是 <span style="color: ${color};">${zhang.fakeRole}</span>。<i>（DM暗记：可能包含在场狼人）</i></li>`;
    }
    
    // (2) 张寿臣的假身份
    const zhangShouChen = playersList.find(p => p.name === "张寿臣");
    if (zhangShouChen) {
        const inPlaySeenGood = playersList.filter(p => isSeenAsGood(p.name)).map(p => p.name);
        const outOfPlaySeenGood = seenAsGoodRoles.filter(r => !inPlaySeenGood.includes(r));
        const bluffs = outOfPlaySeenGood.sort(() => 0.5 - Math.random()).slice(0, 3);
        setupHtml += `<li><b>【张寿臣】假身份：</b>请告知三个不在场好人：<span style="color: blue; font-weight:bold;">${bluffs.join("、") || "无可用"}</span></li>`;
    }

    // (3) 戴志诚
    const daiZhiCheng = playersList.find(p => p.name === "戴志诚");
    if (daiZhiCheng) {
        if (daiZhiCheng.isConfused) {
            const targetPair = playersList.filter(p => isSeenAsGood(p.name) && p.name !== "戴志诚").sort(() => 0.5 - Math.random()).slice(0, 2);
            const fakeBadRole = seenAsBadRoles[Math.floor(Math.random() * seenAsBadRoles.length)];
            setupHtml += `<li><b>【戴志诚】<span style="color: purple;">(混乱)</span>：</b>假信息：搞笑阵营的 <span style="color: red;">${fakeBadRole}</span> 在 【${(targetPair[0]?.num + 1) || '?'}号】与【${(targetPair[1]?.num + 1) || '?'}号】之中。</li>`;
        } else {
            let actualBadPlayer = targetBadPlayer;
            if (gameBalanceState === "BALANCED" && realSmallWolvesInPlay.length > 0) {
                actualBadPlayer = realSmallWolvesInPlay[Math.floor(Math.random() * realSmallWolvesInPlay.length)];
            } else if (!actualBadPlayer) {
                actualBadPlayer = playersList.find(p => isSeenAsBad(p.name) && p.name !== "戴志诚");
            }
            
            if (actualBadPlayer) {
                let otherPlayerList = playersList.filter(p => p.num !== actualBadPlayer.num && p.name !== "戴志诚");
                if (gameBalanceState === "WOLF_STRONG") {
                    const knownGood = otherPlayerList.filter(p => isSeenAsGood(p.name));
                    if (knownGood.length > 0) otherPlayerList = knownGood;
                }
                const otherPlayer = otherPlayerList[Math.floor(Math.random() * otherPlayerList.length)];
                const targetPair = [actualBadPlayer, otherPlayer].filter(Boolean).sort(() => 0.5 - Math.random());
                setupHtml += `<li><b>【戴志诚】(清醒)：</b>真信息：搞笑阵营的 <span style="color: red;">${actualBadPlayer.name}</span> 在 【${targetPair[0].num + 1}号】与【${targetPair[1].num + 1}号】之中。</li>`;
            }
        }
    }

    // (4) 苏文茂
    const suWenMao = playersList.find(p => p.name === "苏文茂");
    if (suWenMao) {
        if (suWenMao.isConfused) {
            const allInPlayRoles = playersList.filter(p => p.name !== "苏文茂").map(p => p.name);
            const allOutPlayRoles = allRoles.filter(r => !allInPlayRoles.includes(r) && r !== "苏文茂");
            const fakeP1 = allInPlayRoles[Math.floor(Math.random() * allInPlayRoles.length)];
            const fakeOutRoles = allOutPlayRoles.sort(() => 0.5 - Math.random()).slice(0, 3);
            const fakeRoles = [fakeP1, ...fakeOutRoles].filter(Boolean).sort(() => 0.5 - Math.random());
            setupHtml += `<li><b>【苏文茂】<span style="color: purple;">(混乱)</span>：</b>假信息：告知这四个角色【${fakeRoles.join("、")}】。<br><span style="color: #666; font-size: 0.9em;"><i>（暗记：仅 ${fakeP1} 在场，打破规则）</i></span></li>`;
        } else {
            let p1 = targetBadPlayer ? targetBadPlayer.name : null;
            if (gameBalanceState === "BALANCED" && realSmallWolvesInPlay.length > 0) {
                p1 = realSmallWolvesInPlay[Math.floor(Math.random() * realSmallWolvesInPlay.length)].name;
            } else if (!p1) {
                const badList = playersList.filter(p => isSeenAsBad(p.name));
                p1 = badList.length > 0 ? badList[0].name : "未知";
            }

            const inPlaySeenGoodList = playersList.filter(p => isSeenAsGood(p.name) && p.name !== "苏文茂" && p.name !== p1);
            let p2 = inPlaySeenGoodList.length > 0 ? inPlaySeenGoodList[Math.floor(Math.random() * inPlaySeenGoodList.length)].name : "未知";

            const inPlayRoles = playersList.map(p => p.name);
            const outPlaySeenBadList = seenAsBadRoles.filter(r => !inPlayRoles.includes(r));
            const outPlaySeenGoodList = seenAsGoodRoles.filter(r => !inPlayRoles.includes(r));
            
            let p3 = outPlaySeenBadList.length > 0 ? outPlaySeenBadList[Math.floor(Math.random() * outPlaySeenBadList.length)] : "未知";
            let p4 = outPlaySeenGoodList.length > 0 ? outPlaySeenGoodList[Math.floor(Math.random() * outPlaySeenGoodList.length)] : "未知";

            const suInfoRoles = [p1, p2, p3, p4].filter(r => r !== "未知").sort(() => 0.5 - Math.random());
            
            setupHtml += `<li><b>【苏文茂】(清醒)：</b>真信息：告知这四个角色【${suInfoRoles.join("、")}】。<br><span style="color: #666; font-size: 0.9em;"><i>（暗记：在场的是 ${p1} 和 ${p2}。</i></span>`;
            if (gameBalanceState === "WOLF_STRONG") setupHtml += `<span style="color: #c62828; font-size: 0.9em; font-weight:bold;"><i>与戴志诚交叉指向 ${p1}）</i></span></li>`;
            else setupHtml += `</li>`;
        }
    }

    // (5) 师胜杰
    const shiShengJie = playersList.find(p => p.name === "师胜杰");
    if (shiShengJie) {
        const idx = playersList.indexOf(shiShengJie);
        const len = playersList.length;
        const neighbors = [
            playersList[(idx - 1 + len) % len], playersList[(idx - 2 + len) % len],
            playersList[(idx + 1) % len], playersList[(idx + 2) % len]
        ];
        
        let realBadCount = 0;
        neighbors.forEach(p => { if (isSeenAsBad(p.name)) realBadCount++; });

        if (shiShengJie.isConfused) {
            let fakeCounts = [0, 1, 2, 3, 4].filter(num => num !== realBadCount);
            let fakeCount = fakeCounts[Math.floor(Math.random() * fakeCounts.length)];
            setupHtml += `<li><b>【师胜杰】<span style="color: purple;">(混乱)</span>：</b>假信息：请告诉他数字 <span style="color: red; font-size: 1.2em; font-weight: bold;">${fakeCount}</span>。</li>`;
        } else {
            setupHtml += `<li><b>【师胜杰】(清醒)：</b>真信息：请告诉他真实数字 <span style="color: red; font-weight: bold;">${realBadCount}</span>。</li>`;
        }
    }

    // (6) 高峰 交互式信息生成
    const gaoFeng = playersList.find(p => p.name === "高峰");
    if (gaoFeng) {
        let options = "<option value=''>请选择座号</option>";
        playersList.forEach(p => {
            if(p.name !== "高峰") {
                options += `<option value='${p.num}'>${p.num + 1}号</option>`;
            }
        });

        setupHtml += `<li><b>【高峰】信息生成器：</b>等待他选择两名玩家后在此输入：<br>
            <select id='gf_p1' style='margin-top:5px; margin-right:5px; padding:3px; border-radius:4px;'>${options}</select>
            <select id='gf_p2' style='margin-top:5px; margin-right:5px; padding:3px; border-radius:4px;'>${options}</select>
            <button onclick='calcGaoFeng("${gameBalanceState}")' style='padding:3px 10px; cursor:pointer; background-color:#1976d2; color:white; border:none; border-radius:4px;'>生成回复</button>
            <div id='gf_result' style='margin-top:8px; min-height:24px; padding:5px; background-color:#f5f5f5; border-radius:4px;'><i>生成的回复将显示在这里...</i></div>
        </li>`;
    }

    setupHtml += "</ul></div>";
    return setupHtml;
}

// ==========================================
// 交互模块：高峰信息动态生成
// ==========================================
function calcGaoFeng(balanceState) {
    const gf = playersList.find(p => p.name === "高峰");
    if (!gf) return;

    const p1_idx = document.getElementById('gf_p1').value;
    const p2_idx = document.getElementById('gf_p2').value;
    const resultDiv = document.getElementById('gf_result');

    if (p1_idx === "" || p2_idx === "") {
        resultDiv.innerHTML = "<span style='color:red; font-weight:bold;'>❌ 请先在下拉菜单选择两名目标玩家！</span>";
        return;
    }
    if (p1_idx === p2_idx) {
        resultDiv.innerHTML = "<span style='color:red; font-weight:bold;'>❌ 必须选择两名不同的玩家！</span>";
        return;
    }

    const t1 = playersList[parseInt(p1_idx)];
    const t2 = playersList[parseInt(p2_idx)];

    if (gf.isConfused) {
        let fakes = allRoles.filter(r => r !== t1.name && r !== t2.name).sort(() => 0.5 - Math.random());
        resultDiv.innerHTML = `<span style='color: purple; font-weight:bold;'>(已混乱 - 全假)</span> 请照读：<br>
            【${t1.num + 1}号是 <b style='color:red;'>${fakes[0]}</b>，${t2.num + 1}号是 <b style='color:red;'>${fakes[1]}</b>】<br>
            <span style='color:#666; font-size:0.85em;'>(DM暗记：真实为 ${t1.name} 和 ${t2.name})</span>`;
    } else {
        let fakes = allRoles.filter(r => r !== t1.name && r !== t2.name).sort(() => 0.5 - Math.random());
        let isBothTrue = false;
        
        if (balanceState === "WOLF_STRONG") {
            isBothTrue = true;
        } else if (balanceState === "HUMAN_STRONG") {
            isBothTrue = false;
        } else {
            isBothTrue = Math.random() < 0.5;
        }

        if (isBothTrue) {
            resultDiv.innerHTML = `<span style='color: green; font-weight:bold;'>(清醒 - 全真)</span> 请照读：<br>
                【${t1.num + 1}号是 <b style='color:blue;'>${t1.name}</b>，${t2.num + 1}号是 <b style='color:blue;'>${t2.name}</b>】`;
        } else {
            let msg = "";
            if (Math.random() < 0.5) { 
                msg = `【${t1.num + 1}号是 <b style='color:blue;'>${t1.name}</b>，${t2.num + 1}号是 <b style='color:red;'>${fakes[0]}</b>】`;
            } else {
                msg = `【${t1.num + 1}号是 <b style='color:red;'>${fakes[0]}</b>，${t2.num + 1}号是 <b style='color:blue;'>${t2.name}</b>】`;
            }
            resultDiv.innerHTML = `<span style='color: #0277bd; font-weight:bold;'>(清醒 - 一真一假)</span> 请照读：<br>
                ${msg}<br>
                <span style='color:#666; font-size:0.85em;'>(DM暗记：真实为 ${t1.name} 和 ${t2.name})</span>`;
        }
    }
}
