let totalLapsData = [];
let currentFilteredMenu = [];
let currentSubFiltered = [];

let currentDropdownOpen = null;

const selectedIds = new Set();

document.addEventListener("DOMContentLoaded", () => {
	// aggiungi ad ogni riga un campo id diverso per ogni riga
	d3.csv("data/normalized_lap_data.csv").then(data => {
		totalLapsData = data.map((d, i) => ({ ...d, id: i }));
		//console.log("Dataset loaded:", totalLapsData.length, "laps");

		totalLapsData = totalLapsData.slice(0, 3400);

		// scarta le righe dalla 6781 in poi (per ora)
		totalLapsData = totalLapsData.slice(0, 5616);
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

document.getElementById("kInput").addEventListener("input", () => {
  let val = parseInt(document.getElementById("kInput").value, 10);
  if (val > 8) document.getElementById("kInput").value = 8;
  if (val < 1) document.getElementById("kInput").value = 1;
});

d3.select("#containerLegend").html("");


function updateLegend(colorMap, label) {
  console.log("Updating legend for", label, colorMap);
  const container = d3.select("#containerLegend");
  container.html(""); // svuota contenuto precedente

  container.append("div")
    .attr("class", "legend-title")
    .text(label);

  const items = container.append("div")
    .attr("class", "legend-items");
  const k = parseInt(document.getElementById("kInput").value, 10);
  const entries = label === "Cluster" ? Object.entries(colorMap).slice(0, k) : Object.entries(colorMap);

  entries.forEach(([key, color]) => {
	let keyText = key;
	if (label == 'Cluster') keyText = `Cluster ${Number(key) + 1}`;

    const item = items.append("div")
      .attr("class", "legend-item");

    item.append("span")
      .attr("class", "legend-color")
      .style("background-color", color);

    item.append("span")
      .attr("class", "legend-label")
      .text(keyText in teamStringMap ? teamStringMap[keyText] : keyText);
  });
}



function updateLegendColors() {
	switch (colorBy) {
		case 'cluster':
			updateLegend(clusterColorMap, 'Cluster');
			break;
		case 'team':
			updateLegend(teamColorMap, 'Team');
			break;
		case 'track':
			updateLegend(trackColorMap, 'Track');
			break;
		default:

			break;
	}
}

function initAll(data, opts = {}) {
	const cfg = {
		idKey: opts.idKey || "id",
	};

	function SelectionChange(source) {
		if (source === "plot") {
			const ids = Array.from(selectedIds);
			tableApi.setSelection(ids);
			SPLOMContext.setSelection();
			apiParallel.setSelection(ids);
			apiTyreDeg.updateSelection();
			apiPCA.updateSelection(ids);
		} else if (source === "table") {
			const ids = Array.from(selectedIds);
			plotApi.setSelection();
			SPLOMContext.setSelection();
			apiParallel.setSelection(ids);
			apiTyreDeg.updateSelection();
			apiPCA.updateSelection(ids);
		} else if (source === "parallel") {
			const ids = Array.from(selectedIds);
			plotApi.setSelection();
			tableApi.setSelection(ids);
			SPLOMContext.setSelection();
			apiTyreDeg.updateSelection();
			apiPCA.updateSelection(ids);
		} else if (source === "pca") {
			const ids = Array.from(selectedIds);
			plotApi.setSelection();
			tableApi.setSelection(ids);
			SPLOMContext.setSelection();
			apiParallel.setSelection(ids);
			apiTyreDeg.updateSelection();
			updateLegendColors();
		} else if (source === "pca2") {
			const ids = Array.from(selectedIds);
			plotApi.setSelection();
			tableApi.setSelection(ids);
			SPLOMContext.setSelection();
			apiParallel.setSelection(ids);
			apiTyreDeg.updateSelection();
		} else if (source === "splom") {
			const ids = Array.from(selectedIds);
			plotApi.setSelection();
			tableApi.setSelection(ids);
			apiParallel.setSelection(ids);
			apiTyreDeg.updateSelection();
			apiPCA.updateSelection(ids);
		}
	}

	const dispatcher = d3.dispatch("selectionChanged");

	const SPLOMContext = initSPLOM(
		{ onSelectionChange: () => SelectionChange("splom") }
	);
	updateSPLOM(data, SPLOMContext);
	renderAllCellPoints(SPLOMContext, 300);
	d3.select("#splom").style("display", "flex");
	d3.select("#pairView").style("display", "none");

	const plotApi = initBoxPlot(data, {
		idKey: cfg.idKey,
		onSelectionChange: () => SelectionChange("plot"),
	});

	const tableApi = drawLapTable(data, {
		idKey: cfg.idKey,
		onSelectionChange: () => SelectionChange("table"),
	});

	const apiParallel = drawParallelCoordsLinked(data, {
		idKey: cfg.idKey,
		onSelectionChange: () => SelectionChange("parallel"),
	});

	const apiTyreDeg = drawTyreWearLinePlot(data, {});

	const apiPCA = initPCAScatter(data, {
		onColorChange: () => SelectionChange("pca"),
		onSelectionChange: () => SelectionChange("pca2"),
	});

	const api = {
		getSelected: () => Array.from(selectedIds),
		clearSelection: () => { selectedIds.clear(); dispatcher.call("selectionChanged"); },
		setSelection: (ids) => { selectedIds.clear(); ids.forEach(i => selectedIds.add(i)); dispatcher.call("selectionChanged"); },
		on: (evt, cb) => dispatcher.on(evt, cb),
	};

  	return api;
}

const heatmapBins = 10;

function updateCharts() {
	initAll(currentSubFiltered);
}

