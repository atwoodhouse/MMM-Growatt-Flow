/* MagicMirror²
 * Module: MMM-Growatt-Flow
 *
 * By atwoodhouse https://github.com/atwoodhouse/MMM-Growatt-Flow
 * MIT Licensed.
 */

Module.register("MMM-Growatt-Flow", {
    defaults: {
        growatt: null,
    },

    getTemplate: function () {
        return "MMM-Growatt-Flow.njk";
    },

    getTemplateData: function () {
        return { growatt: this.growatt };
    },

    getGrowattData: function () {
        Log.info("time to fetch growatt data");
        this.sendSocketNotification("GET_GROWATT_DATA", this.config);
    },

    scheduleUpdate: function () {
        this.interval = setInterval(() => this.getGrowattData(), 60000); // update once per minute
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GROWATT_DATA") {
            console.log("new data from Growatt");
            this.growatt = payload;
            this.updateDom();
        }
    },

    start: function () {
        Log.info(`Starting module: ${this.name}`);

        this.getGrowattData();
        this.scheduleUpdate();
    },

    stop: function () {
        Log.info(`Starting module: ${this.name}`);
        clearInterval(this.interval);
    },
});
