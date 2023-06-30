/* MagicMirror²
 * Module: MMM-Growatt-Flow
 *
 * By atwoodhouse https://github.com/atwoodhouse/MMM-Growatt-Flow
 * MIT Licensed.
 */

Module.register("MMM-Growatt-Flow", {
    defaults: {
        growatt: null,
        electricityPrice: null,
        area: "SE3",
    },

    getStyles: function() {
        return ["MMM-Growatt-Flow.css"]
    },

    getTemplate: function () {
        return "MMM-Growatt-Flow.njk";
    },

    getTemplateData: function () {
        return {
            growatt: this.growatt,
            electricityPrice: this.electricityPrice,
            hourlyProfitOrCost: this.hourlyProfitOrCost,
        };
    },

    getGrowattData: function () {
        Log.info("time to fetch growatt data");
        this.sendSocketNotification("GET_GROWATT_DATA", this.config);
    },

    getElectricityPrice: function () {
        Log.info("time to fetch elecricity price");
        this.sendSocketNotification("GET_ELECTRICITY_PRICE", this.config);
    },

    getHourlyProfitOrCost: function () {
        if (this.electricityPrice && this.growatt) {
            this.hourlyProfitOrCost =
                (this.electricityPrice * ((this.growatt.grid * -1) / 1000 || 0)).toFixed(2);
        }
    },

    scheduleUpdate: function () {
        const UPDATE_INTERVAL_IN_MINUTES = 5;
        this.interval = setInterval(() => {
            // fetch Growatt data every minute
            this.getGrowattData();
            this.getElectricityPrice();
        }, UPDATE_INTERVAL_IN_MINUTES * 60000);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GROWATT_DATA") {
            console.log("new data from Growatt");
            this.growatt = payload;

            this.getHourlyProfitOrCost();

            this.updateDom();
        } else if (notification === "ELECTRICITY_PRICE") {
            console.log("new electricity price", payload);
            this.electricityPrice = payload.electricityPrice;

            this.getHourlyProfitOrCost();

            this.updateDom();
        }
    },

    start: function () {
        Log.info(`Starting module: ${this.name}`);

        this.getGrowattData();
        this.getElectricityPrice();
        this.scheduleUpdate();
    },

    stop: function () {
        Log.info(`Starting module: ${this.name}`);
        clearInterval(this.interval);
    },
});
