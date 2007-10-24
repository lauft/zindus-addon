/* ***** BEGIN LICENSE BLOCK *****
 * 
 * "The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is Zindus Sync.
 * 
 * The Initial Developer of the Original Code is Moniker Pty Ltd.
 *
 * Portions created by Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 * 
 * Contributor(s): Leni Mayo
 * 
 * ***** END LICENSE BLOCK *****/

include("chrome://zindus/content/syncfsmobserver.js");
include("chrome://zindus/content/statuspanel.js");

function ZinTimer(functor)
{
	zinAssert(arguments.length == 1);

	this.m_timer   = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	this.m_functor = functor;
	this.m_logger  = newZinLogger("ZinTimer");
}

ZinTimer.prototype.start = function(delay)
{
	zinAssert(arguments.length == 1);

	var today = new Date();
	var timeInMs = Date.now();
	var dateExpires = new Date(timeInMs + 1000 * delay);
	this.m_logger.info("start: timer scheduled to fire : " + dateExpires.toLocaleString() );

	zinAssert(typeof delay == 'number');

	// this.m_timer.initWithCallback(this, 1000 * delay, this.m_timer.TYPE_ONE_SHOT);
	// this.m_timer.initWithFuncCallback(timerNotify, this.m_functor, 1000 * delay, this.m_timer.TYPE_ONE_SHOT);

	// x.m_functor = this.m_functor;
	// x.m_logger  = this.m_logger;
	// this.m_timer.initWithCallback(x, 1000 * delay, this.m_timer.TYPE_ONE_SHOT);

	this.m_timer.initWithCallback(this.m_functor, 1000 * delay, this.m_timer.TYPE_ONE_SHOT);
}

var x = new Object();
x.notify = function()
{
	this.m_logger.debug("notify: about to run callback: ");

	zinAssert(typeof this.m_functor.run == 'function');

    this.m_functor.run();
}

function timerNotify(functor)
{
	functor.run();
}

ZinTimer.prototype.cancel = function()
{
	this.m_timer.cancel();

	this.m_timer   = null;  // break the circular reference that leaked memory
	this.m_functor = null;
	this.m_logger  = null;
}

// This method allows us to pass "this" into initWithCallback - it is called when the timer expires.
// This method gives the class an interface of nsITimerCallback, see:
// http://www.xulplanet.com/references/xpcomref/ifaces/nsITimerCallback.html
//
ZinTimer.prototype.notify = function(timer)
{
	this.m_logger.debug("notify: about to run callback: ");

	zinAssert(typeof this.m_functor.run == 'function');

    this.m_functor.run();

	this.cancel();
}

function ZinTimerFunctorSync(id_fsm_functor, a_delay_on_repeat)
{
	zinAssert(arguments.length == 2);
	zinAssert(typeof(a_delay_on_repeat) == 'object');
	zinAssert(parseInt(a_delay_on_repeat["centre"]) >= 0 && parseInt(a_delay_on_repeat["varies"]) >= 0);
	zinAssert(a_delay_on_repeat["repeat"] == null || a_delay_on_repeat["repeat"] >= 0);

	this.m_logger            = newZinLogger("ZinTimerFunctorSync");
	this.m_sfo               = new SyncFsmObserver();
	this.m_messengerWindow   = null;  // also considered putting status here: this.m_addressbookWindow = null;
	this.m_id_fsm_functor    = id_fsm_functor;
	this.m_a_delay_on_repeat = a_delay_on_repeat;
	this.m_is_fsm_functor_first_entry = true;
}

ZinTimerFunctorSync.prototype.notify = function(timer)
{
	this.run();
}

ZinTimerFunctorSync.prototype.run = function()
{
	this.m_logger.debug("run: m_id_fsm_functor: " + this.m_id_fsm_functor);

	ZinMaestro.notifyFunctorRegister(this, this.onFsmStateChangeFunctor, this.m_id_fsm_functor, ZinMaestro.FSM_GROUP_SYNC);
}

ZinTimerFunctorSync.prototype.copy = function()
{
	return new ZinTimerFunctorSync(this.m_id_fsm_functor, this.m_a_delay_on_repeat);
}
	
ZinTimerFunctorSync.prototype.onFsmStateChangeFunctor = function(fsmstate)
{
	this.m_logger.debug("onFsmStateChangeFunctor: entering: m_id_fsm_functor: " + this.m_id_fsm_functor + " fsmstate: " + (fsmstate ? fsmstate.toString() : "null"));

	if (this.m_is_fsm_functor_first_entry)
	{
		if (fsmstate)
		{
			this.m_logger.debug("onFsmStateChangeFunctor: fsm is running: about to retry");

			this.setNextTimer(this.calcDelay(600,0));  // retry in 10 minutes
		}
		else
		{
			this.m_is_fsm_functor_first_entry = false;
			this.m_logger.debug("onFsmStateChangeFunctor: fsm is not running - starting... ");
		
			this.m_messengerWindow = getWindowContainingElementId('zindus-progresspanel');

			if (this.m_messengerWindow)
				this.m_messengerWindow.document.getElementById('zindus-progresspanel').setAttribute('hidden', false);

			var state = new TwoWayFsmState();
			state.setCredentials();

			newZinLogger().info("sync start:  " + getUTCAndLocalTime());
			var syncfsm = new TwoWayFsm(state);
			syncfsm.start();
		}
	}
	else
	{
		var is_window_update_required = this.m_sfo.update(fsmstate);

		if (is_window_update_required)
		{
			if (this.m_messengerWindow.document && this.m_messengerWindow.document.getElementById("zindus-progresspanel"))
			{
				// the window might have disappeared between when we iterated all open windows and now - so we test that
				// the element exists just before setting it's attribute...
				//
				var el_statuspanel_progress_meter = this.m_messengerWindow.document.getElementById("zindus-progresspanel-progress-meter");
				var el_statuspanel_progress_label = this.m_messengerWindow.document.getElementById("zindus-progresspanel-progress-label");

				el_statuspanel_progress_meter.setAttribute('value', this.m_sfo.get(SyncFsmObserver.PERCENTAGE_COMPLETE) );
				el_statuspanel_progress_label.setAttribute('value', this.m_sfo.progressToString());
			}
		}

		if (fsmstate.isFinal())
		{
			var es = this.m_sfo.exitStatus();
			StatusPanel.save(es);

			if (this.m_messengerWindow.document && this.m_messengerWindow.document.getElementById("zindus-progresspanel"))
			{
				this.m_messengerWindow.document.getElementById("zindus-progresspanel-progress-label").setAttribute('value', "");
				this.m_messengerWindow.document.getElementById('zindus-progresspanel').setAttribute('hidden', true);
			}

			if (this.m_messengerWindow.document && this.m_messengerWindow.document.getElementById("zindus-statuspanel"))
				StatusPanel.update(this.m_messengerWindow);

			this.finish();
		}
	}
}

// we're outa here...
//
ZinTimerFunctorSync.prototype.finish = function()
{
	newZinLogger().info("sync finish: " + getUTCAndLocalTime());

	ZinMaestro.notifyFunctorUnregister(this.m_id_fsm_functor);

	if (this.m_a_delay_on_repeat["repeat"] != null)
		this.m_a_delay_on_repeat["repeat"]--;

	if (this.m_a_delay_on_repeat["repeat"] == null || this.m_a_delay_on_repeat["repeat"] > 0)
	{
		this.m_logger.debug("finish: m_a_delay_on_repeat: " + this.m_a_delay_on_repeat["repeat"]);

		var fire_in_seconds = this.calcDelay(this.m_a_delay_on_repeat["centre"], this.m_a_delay_on_repeat["varies"]);
		this.setNextTimer(fire_in_seconds);

		newZinLogger().info("sync next:   " + getUTCAndLocalTime(fire_in_seconds));
	}

	this.m_logger.debug("onFsmStateChangeFunctor: timer finished");
}

ZinTimerFunctorSync.prototype.setNextTimer = function(delay)
{
	this.m_logger.debug("onFsmStateChangeFunctor: rescheduling timer (seconds): " + delay);

	var functor = this.copy();
	var timer = new ZinTimer(functor);
	timer.start(delay);
}

ZinTimerFunctorSync.prototype.calcDelay = function(centre, varies)
{
	return randomPlusOrMinus(centre, varies);
}
