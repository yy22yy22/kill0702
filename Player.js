"use strict";

class Role{
    constructor(name){
        //roleConstructor(party, name, this);
        this.party = rolesPartyDict[name]; // 1坏人 0好人
        this.name = name;
    }
}

class Player{
    constructor(number){
        //playerConstructer(number, this);
        this.num = number;
        this.aliveness = 0; //0在场，1下场，2出局
        this.isYunshe = false;
    }

    setRole(role){
        //playerSetRole(role, this);
        this.party = role.party;
        this.name = role.name;
    }
}
