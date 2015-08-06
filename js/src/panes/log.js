class Log {
	constructor() {
		this._node = document.querySelector("#log");
		this._ts = Date.now();
	}

	log(...data) { return this._log("log", data); }
	debug(...data) { return this._log("debug", data); }
	error(...data) { return this._log("error", data); }

	activate() {}
	deactivate() {}

	_log(type, data) {
		let row = document.createElement("div");
		row.classList.add(type);
		data = data.map(item => {
			return typeof(item) == "object" ? JSON.stringify(item) : item;
		});

		let ts = Date.now();
		let diff = ((ts-this._ts)/1000).toFixed(3);
		row.innerHTML = `[+${diff}] ${data.join(" ")}`;
		this._node.insertBefore(row, this._node.firstChild);

		this._ts = ts;

		console.log(...data);
	}
}

export default new Log();
