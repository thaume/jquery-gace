/*

	Documentation:
	http://damln.github.io/jquery-gace/


	Github project:
	https://github.com/damln/jquery-gace


	Damian Le Nouaille:
	http://www.damln.com
	http://geeksters.co

*/

;(function ( $, window, document, undefined ) {

	/*
		Debounce function
		https://github.com/diaspora/jquery-debounce/blob/master/src/jquery-debounce.js
	*/
	function debounce(callback, delay) {
		var self = this, timeout, _arguments;
		return function() {
			_arguments = Array.prototype.slice.call(arguments, 0),
			timeout = clearTimeout(timeout, _arguments),
			timeout = setTimeout(function() {
				callback.apply(self, _arguments);
				timeout = 0;
			}, delay);

			return this;
		};
	}

	$.extend($.fn, {
		debounce: function(event, callback, delay) {
			this.bind(event, debounce.apply(this, [callback, delay]));
		}
	});

	var
	pluginName,
	loadGoogleAnalyticsLegacy,
	loadGoogleAnalyticsObject,
	loadTwitter,
	loadFacebook;

	window._gaq = window._gaq || [];

	pluginName = "gace",

	/*
		0) Set the Default
		Plugin Default Options
	*/

	defaults = {
		debug: false,

		// ga is for ga(), put _gaq for old Google Analytics
		kind: "ga",
		ua: null,
		domain: window.location.hostname,
		sendPageViewOnStart: true,

		mobileBrowsers: false,
		outboundLinks: false,
		// can be ["Twitter"], ["Facebook"], or ["Twitter", "Facebook"]:
		socialTracking: [],
		inactiveTab: false,
		scrollEvents: false,
		formEvents: false,

		// can be "dimension" or "customVar":
		mobileBrowsersMode: "customVar",
		mobileBrowsersCustomVarIndex: 1,
		mobileBrowsersDimensionIndex: 1,

		// $("a.out") or other jQuery selector, can be null
		outboundLinksElements: null,
		outboundLinksOnlyBlank: false,
		// in milliseconds
		outboundLinksTimeout: 200,

		// in seconds:
		inactiveTabMax: 10,
		// in seconds:
		inactiveTabMinTime: 3,
		// in seconds, can be null:
		inactiveTabMaxTime: null,

		// can be "event", or "social"
		socialTrackingKind: "social",
		socialTrackingTime: false,
		fbAppId: "134030676692228"
	};

	/*
		Load External SDK if needed.
		Internal Usage only, And this is only loaded if needed
	*/

	loadGoogleAnalyticsLegacy = function () {
		(function() {
			var ga = document.createElement("script"); ga.type = "text/javascript"; ga.async = true;
			ga.src = ("https:" === document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
			var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ga, s);
		})();
	};

	loadGoogleAnalyticsObject = function () {
		if ( window.GoogleAnalyticsObject ) {
			return null;
		}

		(function (i, s, o, g, r, a, m) {
		    i.GoogleAnalyticsObject = r;
		    i[r] = i[r] || function () {
		        (i[r].q = i[r].q || []).push(arguments);
		    }, i[r].l = 1 * new Date();
		    a = s.createElement(o),
		    m = s.getElementsByTagName(o)[0];
		    a.async = 1; a.src = g;
		    m.parentNode.insertBefore(a, m);
		})( window, document, "script", "//www.google-analytics.com/analytics.js", "ga" );
	};

	loadTwitter = function () {
		if ( typeof window.twttr !== "undefined" ) {
			return null;
		}

		window.twttr = (function (d,s,id) {
		  var t, js, fjs = d.getElementsByTagName(s)[0];
		  if (d.getElementById(id)) {return;} js = d.createElement(s); js.id=id;
		  js.src="//platform.twitter.com/widgets.js";
		  window.twttrJS = js;
		  fjs.parentNode.insertBefore(js, fjs);
		  return window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f); } });
		}(document, "script", "twitter-wjs"));
	};

	loadFacebook = function () {
		(function() {
		  var e = document.createElement("script");
		  e.type = "text/javascript";
		  e.src = document.location.protocol +
		     "//connect.facebook.net/en_US/all.js";
		  e.async = true;
		  document.getElementById("fb-root").appendChild(e);
		}());
	};

	// =====================================

	/*
		The actual plugin constructor
	*/

	function Plugin ( options ) {
		this.settings = $.extend( {}, defaults, options );
		this.counter = 0;
		this.init();
		return this;
	}

	/*
		Plugin Internal Methods
	*/

	Plugin.prototype = {

		/*
			1) Starting Point
			Activated features
		*/

		init: function () {
			var self = this;

			// Our counter for time tracking
			self.counterInterval = setInterval(function() {
				self.counter += 0.2;
			}, 200 );

			// Load Google Analytics JS
			if ( self.settings.kind === "ga" ) {
				loadGoogleAnalyticsObject();
			}

			// Create the GA object if not debug mode
			if ( !self.settings.debug ) {
				if ( self.settings.kind === "ga" ) {
					ga( "create", self.settings.ua, self.settings.domain );
				}

				if ( self.settings.kind === "_gaq" ) {
					_gaq.push( [ "_setAccount", self.settings.ua ] );

					if ( self.settings.domain ) {
						_gaq.push( [ "_setDomainName", self.settings.domain ] );
					}
				}
			}

			// Send first page view
			if ( self.settings.sendPageViewOnStart ) {
				if ( self.settings.kind === "ga" ) {
					ga( "send", "pageview" );
				}

				if ( self.settings.kind === "_gaq" ) {
					_gaq.push( [ "_trackPageview" ] );
				}
			}

			if ( self.settings.kind === "_gaq" ) {
				loadGoogleAnalyticsLegacy();
			}

			// Activate some features by settings

			if ( self.settings.mobileBrowsers ) {
				self.mobileBrowsers();
			}

			if ( self.settings.scrollEvents ) {
				self.scrollEvents();
			}

			if ( self.settings.socialTracking ) {
				self.socialTracking();
			}

			if ( self.settings.outboundLinks ) {
				self.outboundLinks();
			}

			if ( self.settings.inactiveTab ) {
				self.inactiveTab();
			}

			if ( self.settings.formEvents ) {
				self.formEvents();
			}

		},

		/*
			Track Mboile Browser Kind
			Use CustomVar by default, can be send as event, or dimension

			Mobile Browser Kind can be:

			- iOS Safari
			- iOS standalone (when web site was "add to home screen")
			- iOS UIWebView (when website is opened in-app)
			- iOS Chrome (when website is opened in Chrome for iOS)

		*/

		mobileBrowsers: function () {
			var browser, self;
			self = this;

			browser = self._getMobileBrowsers();

			if ( !browser ) {
				return null;
			}

			// With customVar mode
			if ( self.settings.mobileBrowsersMode === "customVar" ) {

				if ( self.settings.kind === "_gaq" ) {
					_gaq.push( [ "_setCustomVar", self.settings.mobileBrowsersCustomVarIndex, "Mobile Browser Kind", browser, 3 ] );
				}
			}

			// With Event mode
			if ( self.settings.mobileBrowsersMode === "event" ) {
				self._sendEvent( "Mobile Browser Kind", "view", browser, null );
			}

			// With Dimension mode ( only ga() )
			if ( self.settings.mobileBrowsersMode === "dimension" ) {
				if ( self.settings.king !== "ga" ) {
					console.log("Warning: you're using Dimension fwith the old ga.js tracker. Please use customVar instead for Mobile Browser Kind tracking");
					return null;
				}

				// HANDLE BROWSER KIND AS DIMENSION, only for ga()
				ga( "set", "dimension" + self.settings.mobileBrowsersDimensionIndex, browser );
			}
		},

		/*
			@TODO
			Handle scroll to elements with:

			"data-gace" attributes

			and

			"data-gace-time" attributes
		*/

		scrollEvents: function () {
			var $elements, self, windowHeight, scrollTop;
			self = this;

			self.scrollEventsElements = {};
			self.scrollEventsRecord = {};

			windowHeight = $( window ).height();
			$elements = $( "[data-gace-bloc]" );

			// Get elements configuration
			$elements.each(function( i, el ) {
				var $el, blocName, ref, percent;

				$el = $( el );
				blocName = $el.attr( "data-gace-bloc" );

				percent = parseInt( $el.attr( "data-gace-view"), 10 );
				percent = percent || 100;

				self.scrollEventsRecord[blocName] = {};
				self.scrollEventsElements[blocName] = {};

				// shortcut to var ref
				ref = self.scrollEventsElements[blocName];

				ref.height = $el.height();
				ref.offset = $el.offset().top;
				ref.bottom = ref.height + ref.offset;
				ref.time = parseInt( $el.attr( "data-gace-time"), 10 ) || 1;
				ref.percent = percent;
			});

			// console.table( self.scrollEventsElements );

			var scrollWindow = function () {

				// Scroll top is the pixels scrolls by viitor
				scrollTop = $( document ).scrollTop();
			};

			// call it once, there are probably elements visibles.
			scrollWindow();

			// Then, Use debounce to not oversend events and attach event
			$( window ).debounce( "scroll", scrollWindow, 200 );
		},

		/*
			Track social like, unlike, send, tweet buttons
		*/

		socialTracking: function () {
			var self, sendEvent;
			self = this;

			// Quick proxy for kind of social event to track
			sendEvent = function( network, action, url ) {
				if ( self.settings.socialTrackingKind === "social" ) {
					self._sendSocial( network, action, url );
				}

				if ( self.settings.socialTrackingKind === "event" ) {
					self._sendEvent( "Sharing on " + network, action, url );
				}
			};

			$.each( self.settings.socialTracking, function( i,item ) {

				// Twitter
				if ( item === "Twitter" && $( ".twitter-share-button" ).length ) {

					// Load Twitter Widget Script if not loaded
					loadTwitter();

					twttr.ready(function() {
						twttr.events.bind( "tweet" , function ( intentEvent ) {
							if ( !intentEvent ) {
								return null;
							}

							sendEvent( "Twitter", "Tweet", document.location.href );
						});
					});
				}

				// Facebook
				if ( item === "Facebook" && $( ".fb-like,.fb-send" ).length ) {


					// Override fbAsyncInit ? I Don't know ... Do you have a better solution?
					window.fbAsyncInit = function () {
						FB.init({appId: self.settings.fbAppId, status: true, cookie: true});

						try {
						    if ( FB && FB.Event && FB.Event.subscribe ) {
								FB.Event.subscribe( "edge.create", function ( response ) {

								    if ( response.indexOf( "facebook.com" ) > 0 ) {
								      sendEvent( "Facebook", "Like", response );
								    } else {
								      sendEvent( "Facebook", "Share", response );
								    }

								});

								FB.Event.subscribe( "edge.remove", function ( response ) {
									sendEvent( "Facebook", "Unlike", response );
								});

								FB.Event.subscribe( "message.send", function ( response ){
									sendEvent( "Facebook", "Send", response );
								});
						    }
						} catch (e) {
							// TODO ?
						}
					};

					// Load FB SDK if needed
					loadFacebook();
				}

			});
		},

		/*
			Public interface (activation in settings)
			Track outbounds links
		*/

		outboundLinks: function () {
			var $elements, self, $links;
			self = this;

			// Get by selector or all external links
			if ( self.settings.outboundLinksElements !== null ) {
				$elements = self.settings.outboundLinksElements;
			} else {
				$elements = $( "a" ).filter(function () {
					return this.hostname && this.hostname !== document.location.hostname;
				});
			}

			// Merge elements
			$links = $( "[data-gace-link]" );
			$elements = $elements.add( $links );

			// on click, do something
			var click = function ( e ) {
				var $el, target, href, newtab, data;
				$el = $(this);

				target = $el.attr( "target" );
				href = $el.attr( "href" );
				data = $el.attr( "data-gace-link" );

				// If ctrlKey is pressed, or target is blank
				if ( e.metaKey || e.ctrlKey || target === "_blank" ) {
					newtab = true;
				}

				if ( self.settings.kind === "ga" ) {
					// @TODO: use hitCallback to redirect
				}

				// Send event to GA
				// Use the attribute data-gace-link="Category,Action,Label" if provided
				if ( data ) {
					var dataSplited, eventCategory, eventAction, eventLabel;

					dataSplited = data.split( "," );
					eventCategory = dataSplited[ 0 ];
					eventAction = dataSplited[ 1 ];
					eventLabel = dataSplited[ 2 ];

					self._sendEvent( eventCategory, eventAction, eventLabel );
				} else {
					self._sendEvent( "Outbound Links", this.hostname, href );
				}

				// Use a HACK to timeout the link changing
				// Can be disable in the settings, disable by default.
				if ( !newtab && !self.settings.outboundLinksOnlyBlank ) {
					e.preventDefault();
					setTimeout( "document.location.href = '"+ href + "';", self.settings.outboundLinksTimeout );
				}
			};

			// Attach event
			$elements.on( "click", click );
		},

		/*
			Detect when the window is active.
			On blur (visitor change tabs or change OS window) it start the counter.
			On focus, it read the counter and send a GA event.
		*/

		inactiveTab: function () {
			var self;
			self = this;

			// Global Name Space
			inactiveTabInterval = 0;

			self.isActive = true;
			self.inactiveTabCounter = 0.0;
			self.inactiveTabCount = 0;

			var blur = function () {
				// Don't send event for more than X time inactivity (see Rate Limit)
				// self.settings.inactiveTabMax
				if ( self.inactiveTabCount >= self.settings.inactiveTabMax ) {
					return null;
				}

				inactiveTabInterval = setInterval(function() {
					self.inactiveTabCounter = self.inactiveTabCounter + 0.2;
				}, 200 );

				self.isActive = false;
			};

			var focus = function () {
				if ( self.isActive ) {
					return null;
				}

				var canSend;
				canSend = true;

				clearInterval( inactiveTabInterval );

				// Send it only if it's greater then the inactiveTabMinTime setting
				if ( self.inactiveTabCounter <= self.settings.inactiveTabMinTime ) {
					canSend = false;
				}

				if ( self.settings.inactiveTabMaxTime && ( self.inactiveTabCounter >= self.settings.inactiveTabMaxTime ) ) {
					canSend = false;
				}

				// Use opt_noninteraction to not consider as "non bounce"
				if ( canSend) {
					self._sendEvent( "Activity", "inactive", "tab", Math.round( self.inactiveTabCounter ), {opt_noninteraction: true} );
				}

				// Reset counter, for next inactivity
				self.inactiveTabCount += 1;
				self.inactiveTabCounter = 0.0;
				self.isActive = true;
			};

			// Attach events
			$( window ).blur( blur );
			$( window ).focus( focus );
		},

		/*
			Track event on form submitions
			Use jQuery Validation Engine plugin for usage
		*/

		formEvents: function () {
			var self, $submits;
			self = this;
			$submits = $(" [data-gace-submit] ");

			$submits.each(function( i, submit ) {
				var $el, $form, onFormSubmit, identifier;
				$el = $( submit );
				$form = $el.parents(" form ").first();

				// Check validation engine exist
				identifier = $form[0].id || "form";

				if ( $.isFunction( $form.validationEngine ) ) {

					onFormSubmit = function ( e ) {
						e.preventDefault();
						var isValid = $form.validationEngine( "validate" );

						if ( isValid ) {
							self._sendEvent( "Form", "valid", identifier );

							// TODO: use hitCallback, no setTimeout
							// after 1 second, submit the form
							setTimeout(function () {
								$form.submit();
							}, 500 );
						} else {
							self._sendEvent( "Form", "not valid", identifier );
						}
					};

				// Just track the submission, no Validation Engine detected
				} else {
					onFormSubmit = function ( e ) {
						e.preventDefault();

						self._sendEvent( "Form", "valid", identifier );
						// TODO: use hitCallback, no setTimeout
						setTimeout(function () {
							$form.submit();
						}, 500 );
					};
				}

				$el.click( onFormSubmit );
			});
		},

		// Public interface to send events

		event: function ( args ) {
			return self._sendEvent( args[0], args[1], args[2], args[3], args[4] );
		},

		//----------- PRIVATE

		/*
			Private interface to get Browser Kind for iOS
		*/

		_getMobileBrowsers: function () {
			var
			standalone = window.navigator.standalone,
		    userAgent = window.navigator.userAgent.toLowerCase(),
		    safari = /safari/.test( userAgent ),
		    chrome = /crios/.test( userAgent ),
		    ios = /iphone|ipod|ipad/.test( userAgent );

			if ( ios ) {
			    if ( !standalone && safari ) {
			        return "iOS Safari";
			    }
			    if ( standalone && !safari ) {
			        return "iOS standalone";
			    }
			    if ( !standalone && !safari ) {
			        return "iOS UIWebView";
			    }
			    if ( chrome && !safari ) {
			        return "iOS Chrome";
				}
			}

			return null;
		},

		/*
			Private interface for sending social events.

			To Google Universal Analytics

			or

			Google Analytics (legacy)
		*/

		_sendSocial: function ( network, action, url ) {
			var params, list, self;
			self = this;

			// For Universal
			if (self.settings.kind === "ga") {
				params = {
					"hitType": "social"
				};

				if ( self.settings.socialTrackingTime ) {
					action = action + " (" + Math.round( self.counter ) + " sec)";
				}

				params.socialNetwork = network;
				params.socialAction = action;
				params.socialTarget = url;

				if ( self.settings.debug ) {
					console.log( "GACE: social ga()" );
					console.log( params );
				} else {
					ga( "send", params );
				}

			// For Classic
			} else {
				list = [ "_trackSocial", network, action, url ];

				if ( self.settings.socialTrackingTime ) {
					list.push( "(" + Math.round( self.counter ) + " sec)" );
				}

				if ( self.settings.debug ) {
					console.log( "GACE: social _gaq" );
					console.log( list );
				} else {
					_gaq.push( list );
				}
			}
		},

		/*
			Private interface for sending events.

			To Google Universal Analytics

			or

			Google Analytics (legacy)
		*/

		_sendEvent: function ( eventCategory, eventAction, eventLabel, eventValue, opts ) {
			var params, list, self;
			self = this;

			if ( typeof eventValue === "undefined" ) {
				// Send the seconds
				eventValue = Math.round( self.counter );
			}

			// For Universal
			if ( self.settings.kind === "ga" ) {
				params = {
					"hitType": "event"
				};

				params.eventCategory = eventCategory;
				params.eventAction = eventAction;

				params.eventLabel = eventLabel;
				params.eventValue = eventValue;

				if ( opts && opts.opt_noninteraction ) {
					params.nonInteraction = opts.opt_noninteraction;
				}

				if ( opts && opts.hitCallback ) {
					params.hitCallback = opts.hitCallback;
				}

				if ( self.settings.debug ) {
					console.log( "GACE: event ga()" );
					console.log( params );
				} else {
					ga( "send", params );
				}

			// For Classic
			} else {
				list = [ "_trackEvent", eventCategory, eventAction ];

				list.push( eventLabel );
				list.push( eventValue );

				if ( opts && opts.opt_noninteraction ) {
					list.push(opts.opt_noninteraction);
				}

				if ( self.settings.debug ) {
					console.log( "GACE: event _gaq" );
					console.log( list );
				} else {
					_gaq.push( list );
				}
			}
		}
	};

	// ====================================
	// EXPOSE PLUGIN to jQuery

	$[ pluginName ] = function ( optionsOrMethod ) {
		// SingleTone
		if ( !$[ pluginName ]._instance ) {
			$[ pluginName ]._instance = new Plugin( optionsOrMethod );
		}
	};

})( jQuery, window, document );
