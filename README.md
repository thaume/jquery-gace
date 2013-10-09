# jQuery Google Analytics Custom Events
jQuery GACE is a plugin for tracking custom events in your web page. It provides a simple wrapper for some custom elements.

## Usage

1. Include jQuery:

	```html
	<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
	```

2. Include plugin's code:

	```html
	<script src="dist/jquery.gace.min.js"></script>
	```

3. Call the plugin:

	```javascript
	jQuery(function($) {
		$.gace({
			ua: "UA-XXXXXXXX-X"
		});
	});
	```

## Features and Options

### First configuration

- `debug` (default: false)
If true, no events will be send to Google Analytics. Instead, console.log will be call with the detail of the event. Very usefull for debugging.

- `kind` (default: "ga", can be "_gaq")
You can choose to send event with `ga()` (new Universal Analytics) or `_gaq.push` (classic Google Analytics). Both can coexist. But Google recommends to use the new Universal Analytics.

- `domain` (default: window.location.hostname)
the domain you want to track. You can put "none" for development.

- `ua` (default: UA-XXXXXXXX-X)
Your Google Analytics profile identifier.

- `sendPageViewOnStart` (default: true)
It will create and send a pageview on plugin load.

	```javascript
	jQuery(function($) {
		$.gace({
			debug: false,
			ua: "UA-XXXXXXXX-X",
			kind: "ga",
			domain: "none",
			sendPageViewOnStart: true
		});
	});
	```

### Better Mobile Browser detection
Today, Google Analytics can display if the browser is Safari (browser or in-app) but it can't detect if the website was run in standalone ("Add To Home Screen" iOS option) or in iOS Chrome.

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		mobileBrowsers: true,

		// Optional:
		mobileBrowsersMode: "customVar"
		mobileBrowsersCustomVarIndex: 1,
		mobileBrowsersDimensionIndex: 1,
		mobileBrowsersCallback: function(browser) {}
	});
	```

- `mobileBrowsersMode` (default: "customVar")

This option control the way to store the browser events in Google Analytics.

1. "event"
Will store the informations in "Events" with this organisation:
Mobile Browser Kind > view > [browser name]

Where [browser name] will be: iOS Safari, iOS standalone, iOS UIWebView or iOS Chrome.

2. "dimension"
If you are using Universal Analytics, you can configure custom Dimensions. You can use 20 dimensions. The browser version is more a Dimension (context) than an event.
You can provide the index you want to use.

3. "customVar"
This is for the old (actual in fact) Google Analytics (ga.js).
You can use 5 custom variables. If you want to store the mobile version as a custom variable,

- `mobileBrowsersCustomVarIndex` (default: 1)
Provide the customVar index you want to use if you have chosen the "customVar".

- `mobileBrowsersDimensionIndex` (default: 1)
Provide the dimension index you want to use if you have chosen the "dimension".

- `mobileBrowsersCallback` (default: null)
Once detected, you have access to a callback with the browser name passed in parameters. Probably you want to use this elsewhere.


### Inactive Tab
Do you know a lot of users will open your page, navigate in an other tab for one or two minutes, and then be back on your page? To track how many times your page was put in background (inactive) you can activate the GACE option.

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		inactiveTab: true,

		// Optional: 
		inactiveTabMax: 10,
		inactiveTabMinTime: 3
	});
	```

When the user `blur` the window, a counter will start in the background. When he will `focus` your page again, an event will be send to Google Analytics with this format:

Activity > inactive > tab > [time in seconds]

Where [time in seconds] will be the time the page was in background.

- `inactiveTabMax` (default: 10)
This setting is use to track the maximum of inactive events per page you want to track.
Imagine a visitor blur and focus your page 30 times in 2 minutes, you will have a lot of useless data in your analytics. Instead, you can control how many times in maximum the events will be send. It's 10 by default, you can ajust it with your needs.

- `inactiveTabMinTime` (default: 3, in seconds)
This settings control how much time the page has to be in background before sending an event. For example, if a visitor open your page, switch to Twitter, and get back on your page in less then the 3 seconds, this is not really an "inactive tab" since 3 seconds is very short. You can ajust what "is" an inactive tab for you. It can be 1 second, or 60 seconds, choose what fit for you.

- `inactiveTabMaxTime` (default: null)
Same as `inactiveTabMinTime`, default to "null" so we keep tracking everything. If you don't want to track inactive tab more than X seconds, put it here.

## Outbound Links
In Google Analytics there is no way to know what externals or download links your visitor has clicked. If you have a download like a PDF or other, you can't track it. GACE provides a flexible way to track this events.

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		outboundLinks: true,

		// Optional: 
		outboundLinksElements: $("a.ga-track"),
		outboundLinksOnlyBlank: false,
		outboundLinksTimeout: 200,
	});
	```

- `outboundLinksElements` (default: $("a") )
By default, GACE will track every <a> with an external link (this.hostname !== document.location.hostname). If you want to track specific elements, just pass them to this option.

- `outboundLinksOnlyBlank` (default: false)
GACE will track all the external links, but you can specify if you just want to track links with target="_blank".

Why?

Because links with no target="_blank" have to use a `setTimeout` to properly send the event to Google Analytics before changing the page.

- `outboundLinksTimeout` (default: 200, in milliseconds)
This timeout can be configured with this option.

## Social Tracking
This plugin integrates a simple tracker for Facebook and Twitter shares activity. It will load the Twitter and Facebook SDK so you just need to put your HTML but not load the Twitter and Facebook widget JavaScript.

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		socialTracking: ["Facebook", "Twitter"],

		// Optional: 
		socialTrackingKind: "social",
		socialTrackingTime: false,

		fbAppId: "1234567"
	});
	```

- `socialTracking` (default: [], so it's desactivated)
This is the Array of networks you want to track. Only Facebook and Twitter are supported for the moment.

- `socialTrackingKind` (default: "social")
Change the way social events are stored. Google Analytics have a special section Under: Traffic Source > Social > Plugins.
By default, GACE uses `_trackSocial` and `ga('send', 'social')`.
But you can track them as a classic Event, just change this option to "event".

- `socialTrackingTime` (default: false)
This will set a eventValue to each social events. It can be interesting to see when they share the page. Is it 2 seconds after the page is open? 2 minutes?
If you activate this, your action name in the Plugin section will look like: "Tweet (24 sec)". That mean the visitor tweet the link 24 seconds after he was on the page.

## Scroll Events (under construction)
This feature is for landing pages or content pages. You want to track if a user actually read your content. GACE will track two metrics: if the bloc id visible + how many times he stays on the bloc.

bloc readed = scroll position (bloc visible) + time at this position.

You configure every bloc in your HTML, this way:

	<div data-gace-bloc="feature3" data-gace-time="2">
	</div>

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		scrollEvents: true
	});
	```

- `data-gace-bloc`
Name of the bloc you want to track

- `data-gace-time` (in seconds)
The minimum time needed on the bloc to trigger the event.

When a bloc with `data-gace-bloc` is visible and the minimum time on the bloc is done, GACE will trigger an event:

Read > scroll > [data-gace-bloc]

## Form events (under construction)

- Activation:

	```javascript
	$.gace({
		ua: "UA-XXXXXXXX-X",
		domain: "example.com",

		formEvents: true
	});
	```

## Structure

The basic structure of the project is given in the following way:

```
├── demo/
│   └── index.html
├── dist/
│   ├── jquery.gace.js
│   └── jquery.gace.min.js
├── src/
│   └── jquery.gace.js
├── .gitignore
├── .jshintrc
├── .travis.yml
├── Gruntfile.js
└── package.json
```

## Guides

### Install Dependencies (for development only)

1. Grunt
	
	```shell
	npm install -g grunt-cli
	```

2. Packages
	
	```shell
	npm install
	```

### Build

	```shell
	grunt
	```

## TODO

- Scroll Events
- hitCallback for outboundLinks
- Trigger internal events to interact with the actions (pub/sub)
- Form Events

## Contributing

Before sending a pull request remember to follow [jQuery Core Style Guide](http://contribute.jquery.org/style-guide/js/).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make your changes on the `src` folder, never on the `dist` folder.
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request

## History
- 0.0.1: First version.

## License

[MIT License](http://zenorocha.mit-license.org/)
