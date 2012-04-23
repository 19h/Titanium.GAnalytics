Titanium.GAnalytics
===================

Google Analytics for Titanium. Without Copyright-Bullshit, use it wherever you want.

#### Thank you, I'm Kenan Sulayman. :) Feel free to fork, modify and hack.. :=)

## Getting started

### 1. Including the plugin into your Titanium project.

        Titanium.include('GATitanium.js');

### 2. Initialize GAnalytics with your Tracking-ID.

        var analytics = new Analytics('UA-XXXXXXXX-X');

### 3. Inject Firing Events.


        Titanium.App.addEventListener('analytics_trackPageview', function (e) {
        GAnalytics.trackPageview('/iPhone' + e.p);

        // Assume every win is a pageview, that is, a page.

        });
        
        Titanium.App.addEventListener('analytics_trackEvent', function (e) {
        GAnalytics.trackEvent(e.category, e.action, e.label, e.value);
        });
        
        Titanium.App.Analytics = {
        trackPageview: function (p) {
                Titanium.App.fireEvent('analytics_trackPageview', {
                        p: p
                });
        },
        trackEvent: function (category, action, label, value) {
                Titanium.App.fireEvent('analytics_trackEvent', {
                        category: category,
                        action: action,
                        label: label,
                        value: value
                });
        }
        }
        
#### Everything to this point should be executed before initialization. (before showing a window)

### 4. Fire up your Pageviews

#### Imagine tracking a user focusing a window.

        win1.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win1');
        });
        
#### … or every window of your app.

        win1.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win1');
        });
        win2.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win2');
        });
        win3.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win3');
        });
        win4.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win4');
        });
        win5.addEventListener('focus', function (e) {
                Titanium.App.Analytics.trackPageview('/win5');
        });
        
#### … your fire pageviews from UIWebViews

                Titanium.App.fireEvent("analytics_trackPageview", {p:"/win1/slider1/drag:left"});
… which tracks user interaction with a css3-slider.

### 5. Be creative. Track whenever a user throws your app into the air at runtime.
Titanium.GAnalytics