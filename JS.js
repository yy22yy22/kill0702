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
        p.isDead = false;  // 存活状态
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

// 桌面底层框架绘制 (样式全权交由 updateTabletopDeathVisuals 接管)
function drawTabletop(){
    let content = "";
    let chart = document.getElementById("playerChart");
    let arc = 2 * Math.PI / playerNum;
    for (let i = 0; i < playerNum; i++){
        let p = playersList[i];
        content += "<div style='left: calc(" + Math.sin(arc*i) + " * (" + playerNum / 9 + " * 25% - 2.5rem) + 50% - 1rem); top: calc(" + Math.cos(arc*i) + " * (" + playerNum / 9 + " * 25% - 2.5rem) + 50% - 1rem);' class='playerNumber'>" + (i+1) + "</div>";
        content += "<div style='left: calc(" + (Math.sin(arc*i) * playerNum / 9) + " * 25% + 50% - 1.75rem); top: calc(" + (Math.cos(arc*i) * playerNum / 9) + " * 25% + 50% - 1.75rem);' class='playerAvatar'>" + p.name + "</div>";
    }
    chart.innerHTML = content;

    // 绘制完骨架后，立刻绑定事件并计算所有颜色
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
    
    // 首夜生成假信息时：判定椅子混乱状态 (排除高晓攀和大兵)
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
    let badOpts = allRoles.filter(isSeenAsBad).map(r => ({val: r, text: r}));
    let pOpts = playersList.map(p => ({val: p.num, text: `${p.num + 1}号 (${p.name})`}));
    let countOpts = [0,1,2,3,4].map(n => ({val: n, text: n}));

    let html = "<div style='border: 2px solid #333; padding: 15px; border-radius: 8px; background-color: #fafafa; margin-top: 15px;'>";
    html += "<h3 style='text-align:center; color:#333; margin-top:0;'>🎭 DM 可修改定制信息板</h3>";

    let adjCount = 0, lastBad = isSeenAsBad(playersList[playerNum - 1].name);
    for(let i=0; i<playerNum; i++) {
        let curBad = isSeenAsBad(playersList[i].name);
        if(lastBad && curBad) adjCount++;
        lastBad = curBad;
    }
    html += `<div style="background-color:#e3f2fd; padding:10px; border-radius:5px; margin-bottom:15px; border:1px solid #90caf9;">
        <strong>📢 全局公告：</strong> 场上存在 <b style="color:red; font-size:1.2em;">${adjCount}</b> 对相邻搞笑阵营。<br>
        <span style="color:#666; font-size:0.9em;">(当前系统判定局势: <b>${window.globalBalanceState}</b>)</span>
    </div><ul style='line-height:2.2; padding-left:20px; text-align:left;'>`;

    let liu = playersList.find(p => p.name === "刘云天");
    if (liu && liu.setupData) {
        let sel = makeSelect(safeOpts, liu.setupData.fakeRole, `updateLiuFakeRole(this.value)`, "120px");
        html += `<li><b>【刘云天】明面身份:</b> 他以为自己是 ${sel} <i>(已过滤：仅显示安全好人)</i>`;
        
        if (liu.setupData.info) {
            let d = liu.setupData.info;
            html += `<br><span style="color:purple; margin-left:15px;">↳ 伪造开局信息：</span>`;
            if (liu.setupData.fakeRole === "戴志诚") {
                html += makeSelect(badOpts, d.role, `updateLiuFakeInfo('role', this.value)`);
                html += " 在 " + makeSelect(pOpts, d.p1, `updateLiuFakeInfo('p1', parseInt(this.value))`);
                html += " 与 " + makeSelect(pOpts, d.p2, `updateLiuFakeInfo('p2', parseInt(this.value))`) + " 之中";
            } else if (liu.setupData.fakeRole === "苏文茂") {
                html += "包含：" + makeSelect(rOpts, d.r1, `updateLiuFakeInfo('r1', this.value)`) + makeSelect(rOpts, d.r2, `updateLiuFakeInfo('r2', this.value)`) + makeSelect(rOpts, d.r3, `updateLiuFakeInfo('r3', this.value)`) + makeSelect(rOpts, d.r4, `updateLiuFakeInfo('r4', this.value)`);
            } else if (liu.setupData.fakeRole === "师胜杰") {
                html += "周围有 " + makeSelect(countOpts, d.count, `updateLiuFakeInfo('count', parseInt(this.value))`) + " 人";
            } else if (liu.setupData.fakeRole === "高峰") {
                let o = "<option value=''>选座号</option>";
                pOpts.forEach(opt => { if(opt.val !== liu.num) o += `<option value='${opt.val}'>${opt.text}</option>`; });
                html += `目标1 <select id='liu_gf_p1'>${o}</select> 目标2 <select id='liu_gf_p2'>${o}</select>
                <button onclick='calcLiuGaoFeng()' style='margin-left:5px; padding:2px 8px; cursor:pointer;'>生成假信息</button>
                <span id='liu_gf_result' style='margin-left:10px; font-size:0.95em;'><i>点击生成...</i></span>`;
            }
        }
        html += `</li>`;
    }

    let zhang = playersList.find(p => p.name === "张伯鑫");
    if (zhang && zhang.setupData) {
        let badR = allRoles.filter(r => rolesPartyDict[r]===1).map(r => ({val:r, text:r}));
        let sel = makeSelect(badR, zhang.setupData.fakeRole, `updateSetup(${zhang.num}, 'fakeRole', this.value)`, "120px");
        html += `<li><b>【张伯鑫】明面身份:</b> 他以为自己是 ${sel} <i>(必须是搞笑阵营)</i></li>`;
    }

    let zsc = playersList.find(p => p.name === "张寿臣");
    if (zsc && zsc.setupData) {
        let s1 = makeSelect(safeOpts, zsc.setupData.b1, `updateSetup(${zsc.num}, 'b1', this.value)`);
        let s2 = makeSelect(safeOpts, zsc.setupData.b2, `updateSetup(${zsc.num}, 'b2', this.value)`);
        html += `<li><b>【张寿臣】假身份:</b> 告知两个好人：${s1} 和 ${s2}</li>`;
    }

    let dai = playersList.find(p => p.name === "戴志诚");
    if (dai && dai.setupData && dai.setupData.info) {
        let d = dai.setupData.info;
        let confStr = dai.isConfused ? "<span style='color:purple; font-weight:bold;'>(首夜受椅子混乱)</span>" : "";
        let sP1 = makeSelect(pOpts, d.p1, `playersList[${dai.num}].setupData.info.p1 = parseInt(this.value)`);
        let sP2 = makeSelect(pOpts, d.p2, `playersList[${dai.num}].setupData.info.p2 = parseInt(this.value)`);
        let sRoleReal = makeSelect(badOpts, d.role, `playersList[${dai.num}].setupData.info.role = this.value`);
        html += `<li><b>【戴志诚】信息 ${confStr}:</b> 搞笑的 ${sRoleReal} 在 ${sP1} 与 ${sP2} 之中。</li>`;
    }

    let su = playersList.find(p => p.name === "苏文茂");
    if (su && su.setupData && su.setupData.info) {
        let d = su.setupData.info;
        let confStr = su.isConfused ? "<span style='color:purple; font-weight:bold;'>(首夜受椅子混乱)</span>" : "";
        let htmlSu = "包含：" + makeSelect(rOpts, d.r1, `playersList[${su.num}].setupData.info.r1 = this.value`) + makeSelect(rOpts, d.r2, `playersList[${su.num}].setupData.info.r2 = this.value`) + makeSelect(rOpts, d.r3, `playersList[${su.num}].setupData.info.r3 = this.value`) + makeSelect(rOpts, d.r4, `playersList[${su.num}].setupData.info.r4 = this.value`);
        html += `<li><b>【苏文茂】信息 ${confStr}:</b> ${htmlSu}</li>`;
    }

    let shi = playersList.find(p => p.name === "师胜杰");
    if (shi && shi.setupData && shi.setupData.info) {
        let confStr = shi.isConfused ? "<span style='color:purple; font-weight:bold;'>(首夜受椅子混乱)</span>" : "";
        let sC = makeSelect(countOpts, shi.setupData.info.count, `playersList[${shi.num}].setupData.info.count = parseInt(this.value)`);
        html += `<li><b>【师胜杰】信息 ${confStr}:</b> 告知左右共 ${sC} 位搞笑阵营。</li>`;
    }

    let gf = playersList.find(p => p.name === "高峰");
    if (gf) {
        let confStr = gf.isConfused ? "<span style='color:purple; font-weight:bold;'>(首夜受椅子混乱)</span>" : "";
        let o = "<option value=''>选座号</option>";
        pOpts.forEach(opt => { if(opt.val !== gf.num) o += `<option value='${opt.val}'>${opt.text}</option>`; });
        html += `<li><div style="background:#fff; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <b>【高峰】动态生成器 ${confStr}:</b> 目标1 <select id='gf_p1'>${o}</select> 目标2 <select id='gf_p2'>${o}</select>
            <button onclick='calcGaoFeng()' style='margin-left:5px; padding:2px 8px; cursor:pointer;'>生成</button>
            <div id='gf_result' style='margin-top:5px; padding:5px; background:#f5f5f5;'><i>点击生成...</i></div>
        </div></li>`;
    }

    html += "</ul></div>";
    document.getElementById("gameInfo").innerHTML = html;
}

window.calcLiuGaoFeng = function() {
    let p1_idx = document.getElementById('liu_gf_p1').value;
    let p2_idx = document.getElementById('liu_gf_p2').value;
    let res = document.getElementById('liu_gf_result');
    
    if (p1_idx === "" || p2_idx === "") { res.innerHTML = "<b style='color:red;'>❌ 请先选两名目标</b>"; return; }
    if (p1_idx === p2_idx) { res.innerHTML = "<b style='color:red;'>❌ 须选不同玩家</b>"; return; }

    let t1 = playersList[parseInt(p1_idx)], t2 = playersList[parseInt(p2_idx)];
    const c = (r) => isSeenAsBad(r) ? "red" : "blue";

    let fakes = allRoles.filter(r => r !== t1.name && r !== t2.name).sort(() => 0.5 - Math.random());
    res.innerHTML = `<span style='color:purple; font-weight:bold;'>(伪造-全假)</span> 【${t1.num+1}号是<b style='color:${c(fakes[0])}'>${fakes[0]}</b>, ${t2.num+1}号是<b style='color:${c(fakes[1])}'>${fakes[1]}</b>】`;
};

window.calcGaoFeng = function() {
    let gf = playersList.find(p => p.name === "高峰");
    if (!gf) return;
    
    let p1_idx = document.getElementById('gf_p1').value;
    let p2_idx = document.getElementById('gf_p2').value;
    let res = document.getElementById('gf_result');
    if (p1_idx === "" || p2_idx === "") { res.innerHTML = "<b style='color:red;'>❌ 请先选两名目标</b>"; return; }
    if (p1_idx === p2_idx) { res.innerHTML = "<b style='color:red;'>❌ 须选两名不同玩家</b>"; return; }

    let t1 = playersList[parseInt(p1_idx)], t2 = playersList[parseInt(p2_idx)];
    const c = (r) => isSeenAsBad(r) ? "red" : "blue";

    if (gf.isConfused) {
        let fakes = allRoles.filter(r => r !== t1.name && r !== t2.name).sort(() => 0.5 - Math.random());
        res.innerHTML = `<span style='color:purple; font-weight:bold;'>(混乱-全假)</span> 【${t1.num+1}号是<b style='color:${c(fakes[0])}'>${fakes[0]}</b>, ${t2.num+1}号是<b style='color:${c(fakes[1])}'>${fakes[1]}</b>】<br><i style='color:#666; font-size:0.85em;'>(真实: ${t1.name}, ${t2.name})</i>`;
        return;
    }

    let fakes = allRoles.filter(r => r !== t1.name && r !== t2.name).sort(() => 0.5 - Math.random());
    let isBothTrue = (window.globalBalanceState === "WOLF_STRONG") ? true : (window.globalBalanceState === "HUMAN_STRONG") ? false : Math.random() < 0.5;

    if (isBothTrue) {
        res.innerHTML = `<span style='color:green; font-weight:bold;'>(清醒-全真)</span> 【${t1.num+1}号是<b style='color:${c(t1.name)}'>${t1.name}</b>, ${t2.num+1}号是<b style='color:${c(t2.name)}'>${t2.name}</b>】`;
    } else {
        let msg = Math.random() < 0.5 
            ? `【${t1.num+1}号是<b style='color:${c(t1.name)}'>${t1.name}</b>, ${t2.num+1}号是<b style='color:${c(fakes[0])}'>${fakes[0]}</b>】`
            : `【${t1.num+1}号是<b style='color:${c(fakes[0])}'>${fakes[0]}</b>, ${t2.num+1}号是<b style='color:${c(t2.name)}'>${t2.name}</b>】`;
        res.innerHTML = `<span style='color:#0277bd; font-weight:bold;'>(清醒-一真一假)</span> ${msg}<br><i style='color:#666; font-size:0.85em;'>(真实为 ${t1.name}, ${t2.name})</i>`;
    }
};

// ==========================================
// 全新联动：死亡管理、云社系统与桌面动态UI
// ==========================================
function attachTabletopDeathEvents() {
    let numbers = document.getElementsByClassName('playerNumber');
    let avatars = document.getElementsByClassName('playerAvatar');
    for (let i = 0; i < playerNum; i++) {
        if (numbers[i]) {
            numbers[i].style.cursor = "pointer";
            numbers[i].onclick = () => toggleDeath(i);
        }
        if (avatars[i]) {
            avatars[i].style.cursor = "pointer";
            avatars[i].onclick = () => toggleDeath(i);
        }
    }
}

window.toggleDeath = function(playerIdx) {
    let p = playersList[playerIdx];
    p.isDead = !p.isDead; 
    let btn = document.getElementById('btn_death_' + playerIdx);
    if(btn) {
        btn.style.backgroundColor = p.isDead ? '#e0e0e0' : '#c8e6c9';
        btn.style.color = p.isDead ? '#888' : '#000';
        btn.style.textDecoration = p.isDead ? "line-through" : "none";
    }
    // 每次死亡状态切换，都会触发整个桌面颜色的重新计算！
    updateTabletopDeathVisuals();
};

// 核心重构：实时接管桌面所有背景和字体的渲染
function updateTabletopDeathVisuals() {
    let numbers = document.getElementsByClassName('playerNumber');
    let avatars = document.getElementsByClassName('playerAvatar');

    // 1. 动态计算受椅子混乱影响的存活玩家 (跨越死人传染)
    let dynamicallyConfused = new Array(playerNum).fill(false);
    let chair = playersList.find(p => p.name === "椅子带王");
    
    // 如果椅子存活，则寻找其左右最近的存活玩家
    if (chair && !chair.isDead) {
        // 寻找左侧存活
        let leftIdx = (chair.num - 1 + playerNum) % playerNum;
        while (playersList[leftIdx].isDead && leftIdx !== chair.num) {
            leftIdx = (leftIdx - 1 + playerNum) % playerNum;
        }
        // 寻找右侧存活
        let rightIdx = (chair.num + 1) % playerNum;
        while (playersList[rightIdx].isDead && rightIdx !== chair.num) {
            rightIdx = (rightIdx + 1) % playerNum;
        }

        // 判断找到的存活者是否是好人且不免疫
        [leftIdx, rightIdx].forEach(idx => {
            if (idx !== chair.num) { // 防止场上只剩椅子一人时的死循环
                let target = playersList[idx];
                if (target && !target.isDead && target.party === 0 && target.name !== "高晓攀" && target.name !== "大兵") {
                    dynamicallyConfused[idx] = true;
                }
            }
        });
    }

    // 2. 遍历渲染座位图所有 UI
    for (let i = 0; i < playerNum; i++) {
        let p = playersList[i];
        let numEl = numbers[i];
        let avaEl = avatars[i];

        if (!numEl || !avaEl) continue;

        if (p.isDead) {
            // 死亡状态：全灰处理
            numEl.style.filter = "grayscale(100%) opacity(0.5)";
            avaEl.style.filter = "grayscale(100%) opacity(0.5)";
            avaEl.style.textDecoration = "line-through";
            avaEl.style.backgroundColor = ""; 
            avaEl.style.color = "";
        } else {
            // 存活状态：清除死者滤镜
            numEl.style.filter = "none";
            avaEl.style.filter = "none";
            avaEl.style.textDecoration = "none";

            // --- 背景色判定 (云社优先) ---
            if (p.isYunShe) {
                // 云社成员：紫色系
                avaEl.style.backgroundColor = "#e1bee7"; // 浅紫头像底
                numEl.style.backgroundColor = "#ab47bc"; // 深紫数字底
            } else {
                if (p.party === 0) {
                    // 正常好人：绿色系
                    avaEl.style.backgroundColor = "#c8e6c9"; 
                    numEl.style.backgroundColor = "#388e3c"; 
                } else {
                    // 狼人/搞笑阵营：读取其原本的底色 (原逻辑 fallback)
                    avaEl.style.backgroundColor = typeof alivenessColour !== 'undefined' ? alivenessColour[p.aliveness] : "#ffcdd2"; 
                    numEl.style.backgroundColor = typeof backgroundColour !== 'undefined' ? backgroundColour[p.party] : "#d32f2f"; 
                }
            }

            // --- 字体色判定 (椅子混乱优先) ---
            if (p.party === 0) { 
                if (dynamicallyConfused[i]) {
                    avaEl.style.color = "black"; // 受椅子混乱变黑！
                    avaEl.style.fontWeight = "bold";
                } else {
                    avaEl.style.color = "blue"; // 正常好人为蓝
                    avaEl.style.fontWeight = "normal";
                }
            } else {
                avaEl.style.color = typeof backgroundColour !== 'undefined' ? backgroundColour[p.party] : "red"; // 坏人维持原本字体色
                avaEl.style.fontWeight = "normal";
            }
        }
    }
}

function initDeadAndYunUI() {
    let container = document.createElement('div');
    container.id = 'deadAndYunPanel';
    container.innerHTML = `
        <div style="border: 2px solid #5e35b1; padding: 15px; border-radius: 8px; background-color: #f3e5f5; margin-top: 15px;">
            <h3 style="margin-top:0; color:#4527a0; text-align:center;">☁️ 云社机制 & 死亡管理控制台</h3>
            
            <div style="margin-bottom: 10px;">
                <strong>💀 死亡状态快捷管理：</strong> <span style="font-size:0.85em; color:#666;">(点击下方按钮，或直接点击上方座位图均可让玩家灰化)</span><br>
                <div id="deathBtnContainer" style="margin-top: 5px; display:flex; flex-wrap:wrap; gap:5px;"></div>
            </div>

            <hr style="border:0; border-top:1px dashed #ab47bc; margin:15px 0;">

            <div style="margin-bottom: 10px;">
                <strong>☁️ 第一天【云社】结算：</strong><br>
                <span style="font-size:0.9em; color:#555;">请选择第一天白天出局的玩家 (系统将根据此人的战力自动计算云社概率)：</span><br>
                <select id="yunSheDeadSelect" style="padding:4px; margin-top:5px; border-radius:4px; margin-right:10px;">
                    <option value="none">无人出局 (平安日)</option>
                </select>
                <button onclick="generateYunShe()" style="padding:4px 12px; background-color:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer;">🔮 选拔云社成员</button>
            </div>
            
            <div id="yunSheResult" style="min-height:50px; background-color:#fff; padding:10px; border-radius:5px; border:1px solid #ce93d8;">
                <i>云社结算结果将在此显示...</i>
            </div>
        </div>
    `;
    
    document.getElementById('gameWindow').appendChild(container);

    let btnContainer = document.getElementById('deathBtnContainer');
    let deadSelect = document.getElementById('yunSheDeadSelect');
    
    for (let i = 0; i < playerNum; i++) {
        let p = playersList[i];
        let btn = document.createElement('button');
        btn.id = 'btn_death_' + i;
        btn.innerText = (i + 1) + "号";
        btn.style.cssText = "padding:3px 8px; border-radius:4px; border:1px solid #ccc; background-color:#c8e6c9; cursor:pointer; min-width:40px;";
        btn.onclick = () => toggleDeath(i);
        btnContainer.appendChild(btn);

        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `${i + 1}号 (${p.name})`;
        deadSelect.appendChild(opt);
    }
}

window.generateYunShe = function() {
    let deadId = document.getElementById("yunSheDeadSelect").value;
    
    // 每次选拔云社，先清除所有人身上的云社标记
    playersList.forEach(p => p.isYunShe = false);

    let aliveGood = playersList.filter(p => !p.isDead && p.party === 0);
    let aliveSmallWolves = playersList.filter(p => !p.isDead && p.party === 1 && p.name !== "张寿臣" && p.name !== "赵本山");

    let picked = [];
    let ruleText = "";
    const shuffle = arr => arr.sort(() => 0.5 - Math.random());

    if (deadId === "none") {
        ruleText = "首日【无人出局】：完全随机从存活小狼与好人中抽取2人。";
        let pool = shuffle([...aliveGood, ...aliveSmallWolves]);
        picked = pool.slice(0, 2);
    } else {
        let deadPlayer = playersList[parseInt(deadId)];
        let is1W1G = false; 

        if (deadPlayer.party === 1) {
            ruleText = `首日出局为狼人 [${deadPlayer.name}]：极大概率 (90%) 选两个好人，(10%) 选一狼一好人。`;
            is1W1G = Math.random() > 0.9; 
        } else if (["侯耀文", "侯宝林", "马季"].includes(deadPlayer.name)) {
            ruleText = `首日出局为强神 [${deadPlayer.name}]：较大概率 (80%) 选一狼一好人，(20%) 选两个好人。`;
            is1W1G = Math.random() < 0.8;
        } else {
            ruleText = `首日出局为其他好人 [${deadPlayer.name}]：中等概率 (50%) 选一狼一好人，(50%) 选两个好人。`;
            is1W1G = Math.random() < 0.5;
        }

        if (is1W1G && aliveSmallWolves.length >= 1 && aliveGood.length >= 1) {
            picked.push(shuffle(aliveSmallWolves)[0]);
            picked.push(shuffle(aliveGood)[0]);
        } else if (aliveGood.length >= 2) {
            if (is1W1G) ruleText += " <span style='color:red;'>(注: 由于存活小狼不足，降级强制选两好人)</span>";
            picked = shuffle(aliveGood).slice(0, 2);
        } else {
            picked = shuffle([...aliveGood, ...aliveSmallWolves]).slice(0, 2);
        }
    }

    if (picked.length < 2) {
         document.getElementById('yunSheResult').innerHTML = "<b style='color:red;'>❌ 存活人数不足，无法开启云社！</b>";
         return;
    }

    picked = shuffle(picked); 
    let p1 = picked[0]; 
    let p2 = picked[1]; 

    // 给选拔出的人打上云社标签，并立刻刷新桌面渲染使其变色！
    p1.isYunShe = true;
    p2.isYunShe = true;
    updateTabletopDeathVisuals();

    const c = (p) => p.party === 1 ? 'red' : 'blue';
    const pLabel = (p) => `【${p.num + 1}号 <b style='color:${c(p)}'>${p.name}</b>】`;

    let html = `<div style="margin-bottom:8px; font-size:0.9em; color:#555;"><b>🤖 判定依据：</b>${ruleText}</div>`;
    html += `<div style="font-size:1.1em; margin-bottom:12px; color:#333;">☁️ 进入云社的玩家是：${pLabel(p1)} 和 ${pLabel(p2)}</div>`;
    html += `<div style="font-size:1.15em; color:#d84315; font-weight:bold; background:#ffccbc; padding:8px; border-radius:4px; display:inline-block; border:1px solid #ff8a65;">
        🗡️ 获得【一次刀人机会】的是：${pLabel(p1)}
    </div>`;
    
    document.getElementById('yunSheResult').innerHTML = html;
};
