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

// 全局战力状态缓存
window.globalBalanceState = "BALANCED";

// ==========================================
// 辅助函数：阵营判定与UI生成
// ==========================================
function isSeenAsBad(roleName) {
    if (!roleName) return false;
    if (roleName === "大兵") return true;
    if (roleName === "赵本山") return false;
    return rolesPartyDict[roleName] === 1;
}

function isSeenAsGood(roleName) {
    if (!roleName) return false;
    return !isSeenAsBad(roleName);
}

function makeSelect(options, selectedVal, onChangeStr, width = "100px") {
    let html = `<select onchange="${onChangeStr}" style="width:${width}; margin:0 3px; padding:2px; border-radius:3px;">`;
    options.forEach(opt => {
        let sel = (opt.val == selectedVal) ? "selected" : "";
        html += `<option value="${opt.val}" ${sel}>${opt.text}</option>`;
    });
    html += `</select>`;
    return html;
}

// ==========================================
// 核心系统：初始化与角色分配
// ==========================================
function init(){
    playersList = [];
    roleAndPlayerDic = {};
    document.getElementById("initialWindow").hidden = false;
    document.getElementById("gameWindow").hidden = true;
    playerNum = parseInt(document.getElementById("PlayerNumber").value);
    
    for (let i = 0; i < playerNum; i++){
        let p = new Player(i);
        p.isConfused = false; 
        p.setupData = null; 
        p.isDead = false; // 初始化存活状态
        p.isYunShe = false; // 云社状态
        playersList.push(p);
    }
    
    funnyNum = (playerNum < 11) ? 2 : 3;
    comedyNum = playerNum - funnyNum - 1;
    distributeRoles();
    document.getElementById("comedyNumRegion").innerHTML = comedyNum;
    document.getElementById("funnyNumRegion").innerHTML  = funnyNum+1;

    drawStatusDiagram();
    if (tableDisplayed) displayTable();
}

function drawTabletop(){
    let content = "";
    let chart = document.getElementById("playerChart");
    let arc = 2 * Math.PI / playerNum;
    
    // 顺时针，1号在 1 点钟方向 (网页坐标系 Y向下正，X向右正)
    // 12点钟为 -Math.PI / 2 (-90度)
    // 1点钟为 -90度 + 30度(Math.PI / 6)
    let startAngle = -Math.PI / 2 + Math.PI / 6;

    for (let i = 0; i < playerNum; i++){
        let p = playersList[i];
        let angle = startAngle + arc * i;
        let x = Math.cos(angle);
        let y = Math.sin(angle);
        
        // 只生成骨架结构，不写死背景色，全权交给 updateTabletopDeathVisuals 动态渲染
        content += "<div style='left: calc(" + x + " * (" + playerNum / 9 + " * 25% - 2.5rem) + 50% - 1rem); top: calc(" + y + " * (" + playerNum / 9 + " * 25% - 2.5rem) + 50% - 1rem);' class='playerNumber'>" + (i+1) + "</div>";
        content += "<div style='left: calc(" + (x * playerNum / 9) + " * 25% + 50% - 1.75rem); top: calc(" + (y * playerNum / 9) + " * 25% + 50% - 1.75rem);' class='playerAvatar'>" + p.name + "</div>";
    }
    chart.innerHTML = content;

    // 渲染完坐标后，立刻挂载颜色和点击事件
    attachTabletopDeathEvents();
    updateTabletopDeathVisuals();
}

function distributeRoles(){
    let tempPlayerList = [];
    let boss = Math.floor((Math.random()*playerNum));
    tempPlayerList.push(boss);
    playersList[boss].setRole(new Role("张寿臣"));
    roleAndPlayerDic["张寿臣"] = playersList[boss];

    distributeRolesWithDetails(funnyNum, funnyRoles, tempPlayerList);

    let lowBias, highBias, clownBias, lowNum, highNum, clownNum;
    do {
        highBias = Math.random() * (2 / comedyNum) - (1 / comedyNum);
        lowBias = Math.random() * (2 / comedyNum) - (1 / comedyNum);
        clownBias = - (lowBias + highBias);
        highNum = Math.round(comedyNum * (highRate + highBias));
        lowNum = Math.round(comedyNum * (lowRate + lowBias));
        clownNum = Math.round(comedyNum * (clownRate + clownBias));
    } while (highNum < 1 || highNum > highComedyRoles.length || lowNum < 0 || lowNum > lowComedyRoles.length || clownNum < 0 || clownNum > clownComedyRoles.length);

    if (highNum + lowNum + clownNum != comedyNum) clownNum -= (highNum + lowNum + clownNum - comedyNum);
    
    tempPlayerList = distributeRolesWithDetails(highNum, highComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(lowNum, lowComedyRoles, tempPlayerList);
    tempPlayerList = distributeRolesWithDetails(clownNum, clownComedyRoles, tempPlayerList);
}

function distributeRolesWithDetails(roleNum, roles, tempPlayerList){
    let tempList = [];
    for (let i = 0; i < roleNum; i ++){
        let index;
        do{ index = Math.floor((Math.random()*roles.length)); } while (tempList.indexOf(index) != -1);
        tempList.push(index);
        let roleName = roles[index];
        let role = new Role(roleName);
        
        do{ index = Math.floor((Math.random()*playerNum)); } while (tempPlayerList.indexOf(index) != -1);
        tempPlayerList.push(index);

        playersList[index].setRole(role);
        roleAndPlayerDic[roleName] = playersList[index];
    }
    return tempPlayerList;
}

function displayTable(){
    let button = document.getElementById("displayTable");
    button.innerHTML = tableDisplayed ? "展示当前桌面" : "收起当前桌面";
    document.getElementById("playerTableWindow").hidden = tableDisplayed;
    if (!tableDisplayed) drawTabletop();
    tableDisplayed = !tableDisplayed;
}

function drawStatusDiagram(){
    let table = document.getElementById("tableDiv");
    let changeList = "<option value='' selected='true'>不修改</option>";
    for (let i = 0; i < allRoles.length; i ++){
        if(roleAndPlayerDic[allRoles[i]] == undefined){
            changeList += "<option value='" + allRoles[i] + "'>" + allRoles[i] + "</option>";
        }
    }
    let content = "<table style='width: 90%;table-layout:fixed;'><tr><th>玩家</th><th>身份</th><th>阵营</th><th></th></tr>";
    for (let i = 0; i < playerNum; i++){
        let p = playersList[i];
        content += `<tr><td>${p.num + 1}</td><td>${p.name}</td><td>${p.party == 1 ? "搞笑" : "相声"}</td><td><select onchange='changeRole(${i}, this.value)'>${changeList}</select></td></tr>`;
    }
    content += "</table>";
    table.innerHTML = content;
}

function changeRole(num, name){
    let player = playersList[num];
    if (rolesPartyDict[name] == 1) funnyNum ++; else comedyNum ++;
    if (player.party == 1) funnyNum --; else comedyNum --;
    delete roleAndPlayerDic[player.name];
    let role = new Role(name);
    player.setRole(role);
    roleAndPlayerDic[name] = player;
    document.getElementById("comedyNumRegion").innerHTML = comedyNum;
    document.getElementById("funnyNumRegion").innerHTML  = funnyNum+1;
    drawStatusDiagram();
}

// ==========================================
// DM 数据操作交互入口 (响应下拉菜单)
// ==========================================
window.updateSetup = function(pNum, key, val) {
    if(playersList[pNum] && playersList[pNum].setupData) {
        playersList[pNum].setupData[key] = val;
    }
};

window.updateLiuFakeRole = function(val) {
    let liu = playersList.find(p => p.name === "刘云天");
    if (!liu) return;
    liu.setupData.fakeRole = val;
    if (["戴志诚", "苏文茂", "师胜杰", "高峰"].includes(val)) {
        liu.setupData.info = buildFakeInfoForRole(val);
    } else {
        liu.setupData.info = null;
    }
    renderDMSetupInfo(); 
};

window.updateLiuFakeInfo = function(key, val) {
    let liu = playersList.find(p => p.name === "刘云天");
    if (liu && liu.setupData && liu.setupData.info) {
        liu.setupData.info[key] = val;
    }
};

// ==========================================
// 后台数据生成工厂
// ==========================================
function beginNightZero(){
    document.getElementById("gameWindow").hidden = false;
    document.getElementById("initialWindow").hidden = true;
    comedyState = [comedyNum, comedyNum, 0, 0]; 
    funnyState = [funnyNum+1, funnyNum+1, 0, 0]; 
    setGameState();

    autoGenerateSetupData();
    renderDMSetupInfo();

    if(!document.getElementById('deadAndYunPanel')) {
        initDeadAndYunUI();
    }
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

function buildFakeInfoForRole(roleName) {
    let info = {};
    if (roleName === "戴志诚") {
        info = { role: allRoles.filter(isSeenAsBad)[0], p1: 0, p2: 1 };
    } else if (roleName === "苏文茂") {
        let arr = allRoles.sort(() => 0.5 - Math.random()).slice(0, 4);
        info = { r1: arr[0], r2: arr[1], r3: arr[2], r4: arr[3] };
    } else if (roleName === "师胜杰") {
        info = { count: Math.floor(Math.random() * 4) };
    } else if (roleName === "高峰") {
        info = { p1: 0, p2: 1 }; 
    }
    return info;
}

function autoGenerateSetupData() {
    playersList.forEach(p => { p.setupData = {}; p.isConfused = false; });
    
    let chair = playersList.find(p => p.name === "椅子带王");
    if (chair) {
        let idx = chair.num;
        let left = playersList[(idx - 1 + playerNum) % playerNum];
        let right = playersList[(idx + 1) % playerNum];
        if (left.party === 0 && left.name !== "高晓攀" && left.name !== "大兵") left.isConfused = true;
        if (right.party === 0 && right.name !== "高晓攀" && right.name !== "大兵") right.isConfused = true;
    }

    const inPlayRoles = playersList.map(p => p.name);
    const outPlayRoles = allRoles.filter(r => !inPlayRoles.includes(r));
    const seenAsGoodRoles = allRoles.filter(isSeenAsGood);
    const inPlaySeenGood = playersList.filter(p => isSeenAsGood(p.name)).map(p => p.name);

    let liu = playersList.find(p => p.name === "刘云天");
    if (liu) {
        let goodOut = outPlayRoles.filter(r => rolesPartyDict[r] === 0 && r !== "张伯鑫");
        let fallbackOut = outPlayRoles.filter(r => r !== "张伯鑫");
        let role = goodOut.length > 0 ? goodOut[Math.floor(Math.random() * goodOut.length)] : (fallbackOut[0] || "无");
        liu.setupData.fakeRole = role;
        if (["戴志诚", "苏文茂", "师胜杰", "高峰"].includes(role)) liu.setupData.info = buildFakeInfoForRole(role);
    }

    let zhang = playersList.find(p => p.name === "张伯鑫");
    if (zhang) {
        let allBad = allRoles.filter(r => rolesPartyDict[r] === 1);
        zhang.setupData.fakeRole = allBad.length > 0 ? allBad[Math.floor(Math.random() * allBad.length)] : "无";
    }

    const strongGoodRoles = ["戴志诚", "师胜杰", "苏文茂", "高峰", "侯宝林", "侯耀文", "马季"];
    const strongBadRoles = ["曹云金", "赵本山", "椅子带王"];
    let H = playersList.filter(p => isSeenAsGood(p.name) && strongGoodRoles.includes(p.name) && !p.isConfused).length;
    let W = playersList.filter(p => p.party === 1 && strongBadRoles.includes(p.name)).length;

    if (liu && ["戴志诚", "苏文茂", "师胜杰", "高峰"].includes(liu.setupData.fakeRole)) H -= 0.5;
    if (zhang && rolesPartyDict[zhang.setupData.fakeRole] === 1 && zhang.setupData.fakeRole !== "曹云金" && zhang.setupData.fakeRole !== "卓别林") H -= 0.5;

    let balState = (H <= W) ? "WOLF_STRONG" : (H >= W + 3) ? "HUMAN_STRONG" : "BALANCED";
    window.globalBalanceState = balState;

    const smallWolves = playersList.filter(p => p.party === 1 && p.name !== "张寿臣" && p.name !== "赵本山");
    const daBing = playersList.find(p => p.name === "大兵");
    let target = null;
    if (balState === "WOLF_STRONG" && smallWolves.length > 0) target = smallWolves[Math.floor(Math.random() * smallWolves.length)];
    else if (balState === "HUMAN_STRONG") target = daBing || smallWolves[0] || playersList.find(p => isSeenAsBad(p.name));
    else target = smallWolves[0] || playersList.find(p => isSeenAsBad(p.name));

    let zsc = playersList.find(p => p.name === "张寿臣");
    if (zsc) {
        let bluffPool = allRoles.filter(r => rolesPartyDict[r] === 0 && !inPlayRoles.includes(r) && r !== "刘云天" && r !== "张伯鑫");
        let bluffs = bluffPool.sort(() => 0.5 - Math.random()).slice(0, 2);
        zsc.setupData.b1 = bluffs[0] || "";
        zsc.setupData.b2 = bluffs[1] || "";
    }

    let dai = playersList.find(p => p.name === "戴志诚");
    if (dai) {
        if (dai.isConfused) {
            let fakes = allRoles.filter(isSeenAsBad);
            let pairs = playersList.filter(p => isSeenAsGood(p.name) && p.name !== "戴志诚").sort(() => 0.5 - Math.random()).slice(0, 2);
            dai.setupData.info = { role: fakes[Math.floor(Math.random() * fakes.length)], p1: pairs[0]?.num||0, p2: pairs[1]?.num||1 };
        } else {
            let p1Num = 0, p2Num = 1, r = "未知";
            if (target) {
                r = target.name; p1Num = target.num;
                let other = playersList.filter(p => p.num !== target.num && p.name !== "戴志诚")[0];
                if(other) p2Num = other.num;
            }
            dai.setupData.info = { role: r, p1: p1Num, p2: p2Num };
        }
    }

    let su = playersList.find(p => p.name === "苏文茂");
    if (su) {
        if (su.isConfused) {
            let inP = playersList.filter(p => p.name !== "苏文茂").map(p => p.name);
            let outP = allRoles.filter(r => !inPlayRoles.includes(r) && r !== "苏文茂");
            let r1 = inP[Math.floor(Math.random() * inP.length)];
            let outs = outP.sort(() => 0.5 - Math.random()).slice(0, 3);
            su.setupData.info = { r1: r1, r2: outs[0]||"未知", r3: outs[1]||"未知", r4: outs[2]||"未知" };
        } else {
            let p1 = target ? target.name : "未知";
            let p2 = playersList.find(p => isSeenAsGood(p.name) && p.name !== "苏文茂" && p.name !== p1)?.name || "未知";
            let outB = allRoles.filter(isSeenAsBad).find(r => !inPlayRoles.includes(r)) || "未知";
            let outG = allRoles.filter(isSeenAsGood).find(r => !inPlayRoles.includes(r)) || "未知";
            su.setupData.info = { r1: p1, r2: p2, r3: outB, r4: outG };
        }
    }

    let shi = playersList.find(p => p.name === "师胜杰");
    if (shi) {
        let idx = shi.num, len = playerNum;
        let nbs = [playersList[(idx - 1 + len) % len], playersList[(idx - 2 + len) % len], playersList[(idx + 1) % len], playersList[(idx + 2) % len]];
        let c = 0; nbs.forEach(p => { if(isSeenAsBad(p.name)) c++; });
        if (shi.isConfused) {
            let fakes = [0, 1, 2, 3, 4].filter(n => n !== c);
            shi.setupData.info = { count: fakes[Math.floor(Math.random() * fakes.length)] };
        } else {
            shi.setupData.info = { count: c };
        }
    }
}

// ==========================================
// 前端渲染：定制信息板
// ==========================================
function renderDMSetupInfo() {
    const inPlayRoles = playersList.map(p => p.name);

    let safeBluffPool = allRoles.filter(r => 
        rolesPartyDict[r] === 0 && 
        !inPlayRoles.includes(r) && 
        r !== "刘云天" && 
        r !== "张伯鑫"
    );
    let safeOpts = safeBluffPool.map(r => ({val: r, text: r}));

    let rOpts = allRoles.map(r => ({val: r, text: r}));
    let badOpts = allRoles.filter
