// The .general preferences can be edited via the zindus preferences UI
// The other    preferences aren't editable via the zindus UI. To play with them, see Tools/Options/Advanced/General/Config Editor.
//
// Interval and timer values below are in seconds. Common values are: week:604800 day:86400 hour:3600 min:60
//
pref("extensions.zindus.system.as_logfile_max_size",      10000000);   // logfile is truncated when it gets bigger than this
pref("extensions.zindus.system.as_timer_delay_on_start",  3600);       // how long before the sync timer fires after startup
pref("extensions.zindus.system.as_timer_delay_on_repeat", 43200);      // how long before the second and subsequent sync timers fire
pref("extensions.zindus.system.as_allow_pre_release",     false);      // allow the addon to run in a pre-release Thunderbird
pref("extensions.zindus.system.zm_sync_gal_md_interval",  604800);     // how often the entire GAL is requested
pref("extensions.zindus.system.zm_sync_gal_recheck",      2);          // how many zm_sync_gal_md_interval's before if_fewer is retested
pref("extensions.zindus.system.zm_sync_gal_if_fewer",     500);        // sync gal if it contains less than this many contacts
pref("extensions.zindus.system.zm_prefer_soapurl_scheme", "https");    // the scheme to prefer if multiple <soapURL>'s are recieved
pref("extensions.zindus.system.gd_data_transfer_scheme",  "https");    // the scheme to use for Google Contacts get+set (auth always https)
pref("extensions.zindus.system.gd_trash_expire_seconds",  604800);     // cards in zindus/ToBeDeleted older than this are deleted

pref("extensions.zindus.preauth.0.name",                  "free.fr");
pref("extensions.zindus.preauth.0.regexp",                "^https?://zimbra\.free\.fr\/?");
pref("extensions.zindus.preauth.0.preauth_url_hier_part", "zimbra.pl");
pref("extensions.zindus.preauth.0.preauth_post_body",     "login=%username%&password=%password%");

pref("extensions.zindus.general.as_verbose_logging",      "true");     // FIXME: when next migrating prefs, change this to boolean
pref("extensions.zindus.general.as_auto_sync",            "true");     // FIXME: when next migrating prefs, change this to boolean
pref("extensions.zindus.general.gd_sync_postal_address",  "false");    // FIXME: when next migrating prefs, change this to boolean
pref("extensions.zindus.general.gd_rule_dont_ask",        "ask-me");   // dont-ask

pref("extensions.{ad7d8a66-253b-11dc-977c-000c29a3126e}.description", "chrome://zindus/locale/zindus.properties");
