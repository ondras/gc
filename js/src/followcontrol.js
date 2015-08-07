import * as pubsub from "pubsub.js";

let FollowControl = JAK.ClassMaker.makeClass({
	NAME: "FollowControl",
	VERSION: "1.0",
	EXTEND: SMap.Control.Visible
});

FollowControl.prototype.$constructor = function() {
	SMap.Control.Visible.prototype.$constructor.call(this);
	this._build();

	pubsub.subscribe("position-change", this);
}

FollowControl.prototype.handleMessage = function(message, publisher, data) {
	this._checkbox.disabled = !data.coords;
}

FollowControl.prototype.handleEvent = function(e) {
	localStorage.setItem("gc-follow", this.isActive() ? "1" : "0");
	pubsub.publish("follow-change", this, {follow:this.isActive()});
}

FollowControl.prototype.isActive = function() {
	return this._checkbox.checked;
}

FollowControl.prototype._build = function() {
	this._dom.container = document.createElement("label");

	this._checkbox = document.createElement("input");
	this._dom.container.appendChild(this._checkbox);
	this._checkbox.type = "checkbox";
	this._checkbox.disabled = true;
	let stored = localStorage.getItem("gc-follow");
	this._checkbox.checked = (stored ? Number(stored) : true);

	this._dom.container.appendChild(document.createTextNode("Follow me"));

	this._checkbox.addEventListener("click", this);
}

export default new FollowControl();
