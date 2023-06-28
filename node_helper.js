const NodeHelper = require("node_helper");
const api = require("growatt");

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
        const consumption = Math.round(data[plantId].devices[deviceSerial].historyLast.pacToLocalLoad);

        return {
            production,
            consumption,
            grid: consumption - production // negative = feeding back to grid
        };
    },

    getGrowattData: async function (payload) {
        const growatt = new api({});
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

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GET_GROWATT_DATA") {
            this.getGrowattData(payload);
        }
    },
});
