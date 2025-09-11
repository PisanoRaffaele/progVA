// #################### FILL FUNCTIONS ####################

function populateFilters(data) {
	// extract unique values from dataset for these categories
	const drivers = [...new Set(data.map(d => d.Driver))];
	const teams = [...new Set(data.map(d => d.Team))];
	const tracks = [...new Set(data.map(d => d.Track))];
	const tyres = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
	const laps = ['0%-25%', '26%-50%', '51%-75%', '76%-100%'];
	const weathers = ['0', '1'];
	const temperatures = ['0', '1', '2', '3', '4'];

	fillDriversDropdown(drivers);
	fillTeamsDropdown(teams);
	fillTracksDropdown(tracks);
	fillTyresDropdown(tyres);
	fillLapsDropdown(laps);
	fillWeatherDropdown(weathers);
	fillTemperatureDropdown(temperatures);
}

function fillTeamsDropdown(teams) {
	//console.log("Filling teams dropdown with:", teams);
	const container = document.getElementById("teamDropdown");
	container.innerHTML = "";

	const teams_div = document.createElement("div");
	teams.forEach(team => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = team;
		checkbox.checked = true;
		div.classList.add("selected");

		const img = document.createElement("img");
		img.src = teamLogos[team] || "logos/default.png";

		const span = document.createElement("span");
		span.textContent = team;

		div.appendChild(checkbox);
		div.appendChild(img);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		checkbox.addEventListener("click", e => {
			e.stopPropagation(); // evita doppio toggle
			div.classList.toggle("selected", checkbox.checked);
		});

		teams_div.appendChild(div);
	});

	const buttonsDiv = document.createElement("div");
	buttonsDiv.classList.add("dropdown-actions");

	const selectAllBtn = document.createElement("button");
	selectAllBtn.textContent = "Select All";
	selectAllBtn.addEventListener("click", () => {
		teams_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = true;
			div.classList.add("selected");
		});
	});

	const deselectAllBtn = document.createElement("button");
	deselectAllBtn.textContent = "Deselect All";
	deselectAllBtn.addEventListener("click", () => {
		teams_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
		});
	});

	buttonsDiv.appendChild(selectAllBtn);
	buttonsDiv.appendChild(deselectAllBtn);

	buttonsDiv.classList.add("header");

	teams_div.classList.add("content");
	container.appendChild(buttonsDiv);
	container.appendChild(teams_div);
}

function fillDriversDropdown(drivers) {
	const container = document.getElementById("driverDropdown");
	container.innerHTML = "";

	const drivers_div = document.createElement("div");
	drivers.forEach(driver => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = driver;
		checkbox.checked = true;
		div.classList.add("selected");

		const img = document.createElement("img");
		img.src = driverFlags[driver] || "assets/flags/default.png";

		const span = document.createElement("span");
		span.textContent = DriverTextMap[driver] || driver;

		div.appendChild(checkbox);
		div.appendChild(img);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		drivers_div.appendChild(div);
	});

	const buttonsDiv = document.createElement("div");
	buttonsDiv.classList.add("dropdown-actions");

	const selectAllBtn = document.createElement("button");
	selectAllBtn.textContent = "Select All";
	selectAllBtn.addEventListener("click", () => {
		drivers_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = true;
			div.classList.add("selected");
		});
	});

	const deselectAllBtn = document.createElement("button");
	deselectAllBtn.textContent = "Deselect All";
	deselectAllBtn.addEventListener("click", () => {
		drivers_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
		});
	});

	buttonsDiv.appendChild(selectAllBtn);
	buttonsDiv.appendChild(deselectAllBtn);

	buttonsDiv.classList.add("header");

	drivers_div.classList.add("content");
	container.appendChild(buttonsDiv);
	container.appendChild(drivers_div);
}

function fillTracksDropdown(tracks) {
	const container = document.getElementById("trackDropdown");
	container.innerHTML = "";

	const tracks_div = document.createElement("div");
	tracks.forEach(track => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = track;
		checkbox.checked = true;
		div.classList.add("selected");

		const img = document.createElement("img");
		img.src = trackFlags[track] || "assets/flags/default.png";

		const span = document.createElement("span");
		span.textContent = track;

		div.appendChild(checkbox);
		div.appendChild(img);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		tracks_div.appendChild(div);
	});
	const buttonsDiv = document.createElement("div");
	buttonsDiv.classList.add("dropdown-actions");

	const selectAllBtn = document.createElement("button");
	selectAllBtn.textContent = "Select All";
	selectAllBtn.addEventListener("click", () => {
		tracks_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = true;
			div.classList.add("selected");
		});
	});

	const deselectAllBtn = document.createElement("button");
	deselectAllBtn.textContent = "Deselect All";
	deselectAllBtn.addEventListener("click", () => {
		tracks_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
		});
	});

	buttonsDiv.appendChild(selectAllBtn);
	buttonsDiv.appendChild(deselectAllBtn);

	buttonsDiv.classList.add("header");

	tracks_div.classList.add("content");
	container.appendChild(buttonsDiv);
	container.appendChild(tracks_div);
}

function fillTyresDropdown(tyres) {
	const container = document.getElementById("tyreDropdown");
	container.innerHTML = "";

	const tyres_div = document.createElement("div");
	tyres.forEach(tyre => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = tyre;
		checkbox.checked = true;
		div.classList.add("selected");

		const img = document.createElement("img");
		img.src = tyresImgs[tyre] || "assets/flags/default.png";

		const span = document.createElement("span");
		span.textContent = tyresTextMap[tyre] || tyre;

		div.appendChild(checkbox);
		div.appendChild(img);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		tyres_div.appendChild(div);
	});

	const buttonsDiv = document.createElement("div");
	buttonsDiv.classList.add("dropdown-actions");

	const selectAllBtn = document.createElement("button");
	selectAllBtn.textContent = "Select All";
	selectAllBtn.addEventListener("click", () => {
		tyres_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = true;
			div.classList.add("selected");
		});
	});

	const deselectAllBtn = document.createElement("button");
	deselectAllBtn.textContent = "Deselect All";
	deselectAllBtn.addEventListener("click", () => {
		tyres_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
		});
	});

	buttonsDiv.appendChild(selectAllBtn);
	buttonsDiv.appendChild(deselectAllBtn);

	buttonsDiv.classList.add("header");

	tyres_div.classList.add("content");
	container.appendChild(buttonsDiv);
	container.appendChild(tyres_div);
}

function fillLapsDropdown(laps) {
	const container = document.getElementById("lapsDropdown");
	container.innerHTML = "";

	const minInput = document.createElement("input");
	minInput.type = "percent";
	minInput.placeholder = "Min Lap %";

	const maxInput = document.createElement("input");
	maxInput.type = "percent";
	maxInput.placeholder = "Max Lap %";

	// accept only numbers between 0 and 100, and min < max
	minInput.addEventListener("input", () => {
		minInput.value = minInput.value.replace(/[^0-9]/g, "");
		minInput.value = Math.min(100, Math.max(0, minInput.value));
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			maxInput.value = minInput.value;
		}
	});

	maxInput.addEventListener("input", () => {
		maxInput.value = maxInput.value.replace(/[^0-9]/g, "");
		maxInput.value = Math.min(100, Math.max(0, maxInput.value));
	});

	// quando rimuovi il focus dagli input, ripristina i checkbox
	minInput.addEventListener("blur", () => {
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			maxInput.value = minInput.value;
		}
	});

	maxInput.addEventListener("blur", () => {
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			minInput.value = maxInput.value;
		}
	});

	const inputDiv = document.createElement("div");
	inputDiv.appendChild(minInput);
	inputDiv.appendChild(maxInput);

	const laps_div = document.createElement("div");
	laps.forEach(lap => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = lap;
		checkbox.checked = true;
		div.classList.add("selected");

		const span = document.createElement("span");
		span.textContent = lap;

		div.appendChild(checkbox);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
			minInput.value = "";
			maxInput.value = "";
			inputDiv.classList.remove("selected");
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
			minInput.value = "";
			maxInput.value = "";
			inputDiv.classList.remove("selected");
		});

		laps_div.appendChild(div);
	});

	inputDiv.classList.add("header");
	laps_div.classList.add("content");
	container.appendChild(inputDiv);
	container.appendChild(laps_div);

	// appena vado sullìinput cancella tutti i checkbox
	minInput.addEventListener("focus", () => {
		laps_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
			inputDiv.classList.add("selected");
		});
	});

	maxInput.addEventListener("focus", () => {
		laps_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
			minInput.classList.remove("selected");
			maxInput.classList.add("selected");
		});
	});

}

function fillWeatherDropdown(weathers) {
	const container = document.getElementById("weatherDropdown");
	container.innerHTML = "";

	const weathers_div = document.createElement("div");
	weathers.forEach(weather => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = weather;
		checkbox.checked = true;
		div.classList.add("selected");

		const img = document.createElement("img");
		img.src = weatherIcons[weather] || "assets/flags/default.png";

		const span = document.createElement("span");
		span.textContent = WeatherTextMap[weather] || weather;

		div.appendChild(checkbox);
		div.appendChild(img);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
		});

		weathers_div.appendChild(div);
	});
	container.appendChild(weathers_div);
}

function fillTemperatureDropdown(temperatures) {
	const container = document.getElementById("tempDropdown");
	container.innerHTML = "";

	const minInput = document.createElement("input");
	minInput.type = "Number";
	minInput.placeholder = "Min Temp";

	const maxInput = document.createElement("input");
	maxInput.type = "Number";
	maxInput.placeholder = "Max Temp";

	// accept only numbers between 0 and 80, and min < max
	minInput.addEventListener("input", () => {
		minInput.value = minInput.value.replace(/[^0-9]/g, "");
		minInput.value = Math.min(80, Math.max(0, minInput.value));
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			maxInput.value = minInput.value;
		}
	});

	maxInput.addEventListener("input", () => {
		maxInput.value = maxInput.value.replace(/[^0-9]/g, "");
		maxInput.value = Math.min(80, Math.max(0, maxInput.value));
	});

	// quando rimuovi il focus dagli input, ripristina i checkbox
	minInput.addEventListener("blur", () => {
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			maxInput.value = minInput.value;
		}
	});

	maxInput.addEventListener("blur", () => {
		if (minInput.value && maxInput.value && +minInput.value > +maxInput.value) {
			minInput.value = maxInput.value;
		}
	});

	const inputDiv = document.createElement("div");
	inputDiv.appendChild(minInput);
	inputDiv.appendChild(maxInput);

	const temp_div = document.createElement("div");
	temperatures.forEach(temp => {
		const div = document.createElement("div");
		div.classList.add("option");

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = temp;
		checkbox.checked = true;
		div.classList.add("selected");

		const span = document.createElement("span");
		span.textContent = tempTextMap[temp] || temp;

		div.appendChild(checkbox);
		div.appendChild(span);

		div.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
			minInput.value = "";
			maxInput.value = "";
			inputDiv.classList.remove("selected");
		});

		checkbox.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			div.classList.toggle("selected", checkbox.checked);
			minInput.value = "";
			maxInput.value = "";
			inputDiv.classList.remove("selected");
		});

		temp_div.appendChild(div);
	});

	inputDiv.classList.add("header");
	temp_div.classList.add("content");
	container.appendChild(inputDiv);
	container.appendChild(temp_div);

	// appena vado sullìinput cancella tutti i checkbox
	minInput.addEventListener("focus", () => {
		temp_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
			inputDiv.classList.add("selected");
		});
	});

	maxInput.addEventListener("focus", () => {
		temp_div.querySelectorAll(".option").forEach(div => {
			const checkbox = div.querySelector("input[type=checkbox]");
			checkbox.checked = false;
			div.classList.remove("selected");
			minInput.classList.remove("selected");
			maxInput.classList.add("selected");
		});
	});
}

// #################### GET SELECTED FUNCTIONS ####################

function getSelectedLaps1() {
	const minInput = document.querySelector("#lapsDropdown input[placeholder='Min Lap %']");
	const maxInput = document.querySelector("#lapsDropdown input[placeholder='Max Lap %']");
	const minValue = minInput ? +minInput.value : null;
	const maxValue = maxInput ? +maxInput.value : null;
	return { minValue, maxValue };
}

function getSelectedLaps2() {
	const checkboxes = document.querySelectorAll("#lapsDropdown input[type=checkbox]");
	return Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
}

function getSelectedTemp1() {
	const minInput = document.querySelector("#tempDropdown input[placeholder='Min Temp']");
	const maxInput = document.querySelector("#tempDropdown input[placeholder='Max Temp']");
	const minValue = minInput ? +minInput.value : null;
	const maxValue = maxInput ? +maxInput.value : null;
	return { minValue, maxValue };
}

function getSelectedTemp2() {
	const checkboxes = document.querySelectorAll("#tempDropdown input[type=checkbox]");
	return Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
}

// #################### APPLY FILTERS ####################

function applyFilters() {
	selectedIds.clear();
	clusterColorMap = {};
	idClusterMap = {};
	colorBy = "none";
	d3.select("#container5").select("#PCAselectDiv").select('select').node().value = "none";

	let filtered = [...totalLapsData];

	let lapsRanges = [];

	let { minValue, maxValue } = getSelectedLaps1();
	if (minValue && maxValue) {
		lapsRanges.push({ min: minValue, max: maxValue });
	} else {
		const rangePercentageLaps = getSelectedLaps2();
		if (rangePercentageLaps.length !== 0) {
			rangePercentageLaps.forEach(rangeStr => {
				const [minStr, maxStr] = rangeStr.split('-');
				lapsRanges.push({
					min: parseInt(minStr.replace('%', ''), 10),
					max: parseInt(maxStr.replace('%', ''), 10)
				});
			});

		}
	}

	// console.log("Filtering laps between:", lapsRanges);
	filtered = filtered.filter(d => {
		const track = d.Track;
		const trackMaxLap = d3.max(filtered.filter(f => f.Track === track), f => +f.LapNumber);
		const pct = (+d.LapNumber / trackMaxLap) * 100;
		return lapsRanges.some(range => pct >= range.min - 0.99  && pct <= range.max);
	});

	let tempRanges = [];
	let { minValueTemp, maxValueTemp } = getSelectedTemp1();
	if (minValueTemp && maxValueTemp) {
		tempRanges.push({ min: minValueTemp, max: maxValueTemp });
	} else {
		const rangeTemp = getSelectedTemp2();
		if (rangeTemp.length !== 0) {
			rangeTemp.forEach(value => {
				if (value == 0) { // Very Cold (0–15°C)
					tempRanges.push({ min: 0, max: 15 });
				} else if (value == 1) { // Cold (16–25°C)
					tempRanges.push({ min: 16, max: 25 });
				} else if (value == 2) { // Mild (26–35°C)
					tempRanges.push({ min: 26, max: 35 });
				} else if (value == 3) { // Hot (36–45°C)
					tempRanges.push({ min: 36, max: 45 });
				} else if (value == 4) { // Very Hot (45+°C)
					tempRanges.push({ min: 46, max: 80 });
				}
			});
		}
	}

	// console.log("Filtering temperature between:", tempRanges);

	// console.log("length of filtered:", filtered.length);
	filtered = filtered.filter(d => {
		const temp = +d.TrackTemp;
		return tempRanges.some(range => temp >= range.min - 0.99 && temp <= range.max);
	});


	const checkboxesT = document.querySelectorAll("#teamDropdown input[type=checkbox]");
	const selectedTeams = Array.from(checkboxesT).filter(c => c.checked).map(c => c.value);
	filtered = filtered.filter(d => selectedTeams.includes(d.Team));

	const checkboxesD = document.querySelectorAll("#driverDropdown input[type=checkbox]");
	const selectedDrivers = Array.from(checkboxesD).filter(c => c.checked).map(c => c.value);
	filtered = filtered.filter(d => selectedDrivers.includes(d.Driver));

	const checkboxesTrack = document.querySelectorAll("#trackDropdown input[type=checkbox]");
	const selectedTracks = Array.from(checkboxesTrack).filter(c => c.checked).map(c => c.value);
	filtered = filtered.filter(d => selectedTracks.includes(d.Track));

	const checkboxesTy = document.querySelectorAll("#tyreDropdown input[type=checkbox]");
	const selectedTyres = Array.from(checkboxesTy).filter(c => c.checked).map(c => c.value);
	filtered = filtered.filter(d => selectedTyres.includes(d.Compound));

	const checkboxesW = document.querySelectorAll("#weatherDropdown input[type=checkbox]");
	const selectedWeathers = Array.from(checkboxesW).filter(c => c.checked).map(c => c.value);
	filtered = filtered.filter(d => selectedWeathers.includes(d.Rainfall));

	// console.log("Filtered data:", filtered.length, "laps");
	// console.log("Example:", filtered[0]);

	const currentSelection = document.querySelector(".current-selection");
	currentSelection.innerHTML = `Showing ${filtered.length}/${totalLapsData.length} Laps`;
	currentFilteredMenu = filtered;
	currentSubFiltered = currentFilteredMenu;
	updateCharts();
}
