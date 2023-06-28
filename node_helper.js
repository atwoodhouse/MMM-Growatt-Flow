const NodeHelper = require("node_helper");
const Growatt = require("growatt");
const fetch = require("node-fetch");

const options = {
    plantData: true,
    weather: false,
    totalData: false,
    statusData: true,
    deviceData: true,
    deviceType: false,
    historyLast: true,
    historyAll: false,
};

module.exports = NodeHelper.create({
    requiresVersion: "2.21.0",

    start: function () {
        console.log("Starting node helper for " + this.name);
    },

    convertGrowattData: function (data, { plantId, deviceSerial }) {
        const production = Math.round(data[plantId].devices[deviceSerial].deviceData.pac);
        const consumption = Math.round(
            data[plantId].devices[deviceSerial].historyLast.pacToLocalLoad
        );

        return {
            production,
            consumption,
            grid: consumption - production, // negative = feeding back to grid
        };
    },

    getGrowattData: async function (payload) {
        const growatt = new Growatt({});
        const login = await growatt.login(payload.username, payload.password).catch((e) => {
            console.log(e);
        });
        console.log("login:", login);

        const data = await growatt.getAllPlantData(options).catch((e) => {
            console.log(e);
        });

        const logout = await growatt.logout().catch((e) => {
            console.log(e);
        });
        console.log("logout:", logout);

        const growattData = this.convertGrowattData(data, payload);
        console.log({ growattData });

        this.sendSocketNotification("GROWATT_DATA", growattData);
    },

    getElectricityPrice: async function (payload) {
        const year = new Date().toISOString().slice(0, 4);
        const monthAndDay = new Date().toISOString().slice(5, 10);

        const res = await fetch(`https://www.elprisetjustnu.se/api/v1/prices/${year}/${monthAndDay}_${payload.area}.json`);
        const data = await res.json();
        const electricityPrice = data[new Date().getHours()].SEK_per_kWh;
        console.log({ electricityPrice });
        this.sendSocketNotification("ELECTRICITY_PRICE", { electricityPrice });
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GET_GROWATT_DATA") {
            this.getGrowattData(payload);
        } else if (notification === "GET_ELECTRICITY_PRICE") {
            this.getElectricityPrice(payload);
        }
    },
});
