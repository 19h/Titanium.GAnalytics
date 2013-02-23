(function () {
        var a = !1,
                b = /xyz/.test(function () {}) ? /\b_super\b/ : /.*/;
        this.AnalyticsBase = function () {};
        AnalyticsBase.extend = function (c) {
                function d() {
                        !a && this.init && this.init.apply(this, arguments)
                }
                var f = this.prototype;
                a = !0;
                var g = new this;
                a = !1;
                for (var e in c) g[e] = "function" == typeof c[e] && "function" == typeof f[e] && b.test(c[e]) ?
                function (a, b) {
                        return function () {
                                var c = this._super;
                                this._super = f[a];
                                var d = b.apply(this, arguments);
                                this._super = c;
                                return d
                        }
                }(e, c[e]) : c[e];
                d.prototype = g;
                d.constructor = d;
                d.extend = arguments.callee;
                return d
        }
})();
var Analytics = AnalyticsBase.extend({
        _PAGEVIEW: "__##PAGEVIEW##__",
        _USER_AGENT: "GoogleAnalytics/1.0 (" + Titanium.Platform.username + "; U; CPU " + Titanium.Platform.name + " " + Titanium.Platform.version + " like Mac OS X; " + Titanium.Platform.locale + "-" + Titanium.Locale.getCurrentCountry() + ")",
        _accountId: void 0,
        _db: void 0,
        _session: void 0,
        _storedEvents: 0,
        _dispatcherIsBusy: !1,
        _httpClient: void 0,
        enabled: !0,
        init: function (a) {
                "android" === Ti.Platform.osname && (this._USER_AGENT = "GoogleAnalytics/1.0 (Linux; U; Android " + Titanium.Platform.version + "; " + Titanium.Locale.currentLocale + "; " + Titanium.Platform.model + ")");
                this._accountId = a;
                this._db = Titanium.Database.open("analytics");
                this._initialize_db()
        },
        start: function (a) {
                if (this.enabled) {
                        this._startNewVisit();
                        this._httpClient = Titanium.Network.createHTTPClient({
                                onload: function () {
                                        return Ti.App.disableNetworkActivityIndicator = false;
                                }
                        });
                        var b = this;
                        setInterval(function () {
                                b._dispatchEvents()
                        }, 2E3 * a)
                }
        },
        stop: function () {
                this.enabled = !1
        },
        trackPageview: function (a) {
                this._session && this.enabled && this._createEvent(this._PAGEVIEW, a, null, -1)
        },
        trackEvent: function (a, b, c, d) {
                this._session && this.enabled && this._createEvent(a, b, c, d)
        },
        reset: function () {
                Titanium.App.Properties.setString("analytics_session", null)
        },
        _initialize_db: function () {
                this._db.execute("CREATE TABLE IF NOT EXISTS events (event_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, random_val INTEGER NOT NULL, timestamp_first INTEGER NOT NULL, timestamp_previous INTEGER NOT NULL, timestamp_current INTEGER NOT NULL, visits INTEGER NOT NULL, category STRING NOT NULL, action STRING NOT NULL, label STRING NULL, value INTEGER NOT NULL);");
                for (var a = this._db.execute("SELECT COUNT(*) FROM events"); a.isValidRow();) this._storedEvents = a.field(0), a.next();
                a.close()
        },
        _startNewVisit: function () {
                var a = Math.round((new Date).getTime() / 1E3);
                if (Titanium.App.Properties.hasProperty("analytics_session")) {
                        var b = JSON.parse(Titanium.App.Properties.getString("analytics_session"));
                        this._session = {
                                user_id: b.user_id,
                                timestamp_first: b.timestamp_first,
                                timestamp_previous: b.timestamp_current,
                                timestamp_current: a,
                                visits: b.visits + 1
                        }
                } else this._session = {
                        user_id: Math.floor(9999999999 * Math.random()),
                        timestamp_first: a,
                        timestamp_previous: a,
                        timestamp_current: a,
                        visits: 1
                };
                Titanium.App.Properties.setString("analytics_session", JSON.stringify(this._session))
        },
        _createEvent: function (a, b, c, d) {
                1E3 <= this._storedEvents ? Titanium.API.warn("Analytics: Store full, not storing last event") : (this._db.execute("INSERT INTO events (user_id, random_val, timestamp_first, timestamp_previous, timestamp_current, visits, category, action, label, value) VALUES (?,?,?,?,?,?,?,?,?,?)", this._session.user_id, Math.floor(999999999 * Math.random()), this._session.timestamp_first, this._session.timestamp_previous, this._session.timestamp_current, this._session.visits, a, b, c, d), this._storedEvents++)
        },
        _dispatchEvents: function () {
                if (!this._dispatcherIsBusy && Titanium.Network.online) {
                        this._dispatcherIsBusy = !0;
                        for (var a = this._db.execute("SELECT * FROM events"), b = []; a.isValidRow();) {
                                var c = {
                                        event_id: a.fieldByName("event_id"),
                                        user_id: a.fieldByName("user_id"),
                                        random_val: a.fieldByName("random_val"),
                                        timestamp_first: a.fieldByName("timestamp_first"),
                                        timestamp_previous: a.fieldByName("timestamp_previous"),
                                        timestamp_current: a.fieldByName("timestamp_current"),
                                        visits: a.fieldByName("visits"),
                                        category: a.fieldByName("category"),
                                        action: a.fieldByName("action"),
                                        label: a.fieldByName("label"),
                                        value: a.fieldByName("value")
                                };
                                // Introduced with Build 2.2.0.v20120813184911 of Titanium SDK
                                Ti.App.disableNetworkActivityIndicator = true;
                                this._httpClient.open("GET", "http://www.google-analytics.com" + this._constructRequestPath(c), !1);
                                this._httpClient.setRequestHeader("User-Agent", this._USER_AGENT);
                                this._httpClient.send();
                                b.push(c.event_id);
                                a.next()
                        }
                        a.close();
                        for (a = 0; a < b.length; a++) this._db.execute("DELETE FROM events WHERE event_id = ?", b[a]);
                        this._dispatcherIsBusy = !1
                }
        },
        _constructRequestPath: function (a) {
                var b = new StringBuilder("/__utm.gif");
                b.append("?utmwv=4.4mi");
                b.append("&utmn=").append(a.random_val);
                b.append("&utmcs=UTF-8");
                b.append("&utmsr=" + Titanium.Platform.displayCaps.platformWidth + "x" + Titanium.Platform.displayCaps.platformHeight);
                b.append("&utmsc=24-bit");
                b.append("&utmul=" + Titanium.Platform.locale + "-" + Titanium.Platform.countryCode);
                b.append("&utmac=").append(this._accountId);
                if (a.category == this._PAGEVIEW) b.append("&utmp=").append(a.action);
                else {
                        var c = 0 < a.value ? a.value : 1;
                        b.append("&utmt=event");
                        b.append("&utme=5(" + a.category + "*" + a.action + "*" + a.label + ")(" + c + ")")
                }
                b.append("&utmcc=");
                c = new StringBuilder("__utma=");
                c.append("737325").append(".");
                c.append(a.user_id).append(".");
                c.append(a.timestamp_first).append(".");
                c.append(a.timestamp_previous).append(".");
                c.append(a.timestamp_current).append(".");
                c.append(a.visits);
                b.append(c.toString());
                return b.toString()
        }
});

function StringBuilder(a) {
        this.strings = [""];
        this.append(a)
}
StringBuilder.prototype.append = function (a) {
        a && this.strings.push(a);
        return this
};
StringBuilder.prototype.clear = function () {
        this.strings.length = 1
};
StringBuilder.prototype.toString = function () {
        return this.strings.join("")
};