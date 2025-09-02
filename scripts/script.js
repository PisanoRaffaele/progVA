let totalLapsData = []; 
let currentFilteredMenu = [];
let currentSubFiltered = [];

let currentDropdownOpen = null;

document.addEventListener("DOMContentLoaded", () => {
	// aggiungi ad ogni riga un campo id diverso per ogni riga
	d3.csv("data/normalized_lap_data.csv").then(data => {
		totalLapsData = data.map((d, i) => ({ ...d, id: i }));
		console.log("Dataset loaded:", totalLapsData.length, "laps");

		// select fist 1000
		totalLapsData = totalLapsData.slice(0, 1000);
		populateFilters(totalLapsData);
		applyFilters();
	});

	// Team Dropdown
	document.querySelector("#dropbtn-team").addEventListener("click", () => {
		document.getElementById("teamDropdown").classList.add("show");
		currentDropdownOpen = "team";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-team') && !e.target.closest('#teamDropdown')) {
			document.getElementById("teamDropdown").classList.remove("show");
			if (currentDropdownOpen === "team") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// Driver Dropdown
	document.querySelector("#dropbtn-driver").addEventListener("click", () => {
		document.getElementById("driverDropdown").classList.add("show");
		currentDropdownOpen = "driver";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-driver') && !e.target.closest('#driverDropdown')) {
			document.getElementById("driverDropdown").classList.remove("show");
			if (currentDropdownOpen === "driver") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// Track Dropdown
	document.querySelector("#dropbtn-track").addEventListener("click", () => {
		document.getElementById("trackDropdown").classList.add("show");
		currentDropdownOpen = "track";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-track') && !e.target.closest('#trackDropdown')) {
			document.getElementById("trackDropdown").classList.remove("show");
			if (currentDropdownOpen === "track") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// Tyre Dropdown
	document.querySelector("#dropbtn-tyre").addEventListener("click", () => {
		document.getElementById("tyreDropdown").classList.add("show");
		currentDropdownOpen = "tyre";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-tyre') && !e.target.closest('#tyreDropdown')) {
			document.getElementById("tyreDropdown").classList.remove("show");
			if (currentDropdownOpen === "tyre") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// laps Dropdown
	document.querySelector("#dropbtn-laps").addEventListener("click", () => {
		document.getElementById("lapsDropdown").classList.add("show");
		currentDropdownOpen = "laps";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-laps') && !e.target.closest('#lapsDropdown')) {
			document.getElementById("lapsDropdown").classList.remove("show");
			if (currentDropdownOpen === "laps") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// Temperature Dropdown
	document.querySelector("#dropbtn-temp").addEventListener("click", () => {
		document.getElementById("tempDropdown").classList.add("show");
		currentDropdownOpen = "temp";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-temp') && !e.target.closest('#tempDropdown')) {
			document.getElementById("tempDropdown").classList.remove("show");
			if (currentDropdownOpen === "temp") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});

	// Weather Dropdown
	document.querySelector("#dropbtn-weather").addEventListener("click", () => {
		document.getElementById("weatherDropdown").classList.add("show");
		currentDropdownOpen = "weather";
	});

	window.addEventListener("click", e => {
		if (!e.target.matches('#dropbtn-weather') && !e.target.closest('#weatherDropdown')) {
			document.getElementById("weatherDropdown").classList.remove("show");
			if (currentDropdownOpen === "weather") {
				applyFilters();
				currentDropdownOpen = null;
			}
		}
	});
});

const heatmapBins = 10;

function updateCharts() {
	updateSPLOM(currentSubFiltered, SPLOMContext);
	renderAllCellPoints(SPLOMContext, 1000);

	// renderAllCellHeatmaps(SPLOMContext, heatmapBins);

	drawBoxPlot(currentSubFiltered, {
		maxPointsPerDriver: 500
	});

	const tableApi = drawLapTable(currentSubFiltered, {
	});
}

