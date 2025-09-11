// detect any click on web page, if it is not on tr of table set lastClickedIndexTable = null;
let lastClickedIndexTable = null;
let infoShown = false;
let currentOrderedRows = [];

d3.select("#info-icon-table").on("click", () => {
	if (infoShown) {
		d3.select("#info-container-table").style("display", "none");
		d3.select(".lap-table-wrap").style("display", "block");
		d3.select("#select-all-button").style("visibility", "visible");
		d3.select("#remove-all-button").style("visibility", "visible");
		infoShown = false;
	} else {
		d3.select("#info-container-table").style("display", "flex");
		d3.select(".lap-table-wrap").style("display", "none");
		d3.select("#select-all-button").style("visibility", "hidden");
		d3.select("#remove-all-button").style("visibility", "hidden");
		infoShown = true;
	}
});


document.addEventListener("click", (event) => {
	if (!event.target.closest(".lap-table tbody tr")) {
		lastClickedIndexTable = null;
	}
});

function updateTableHighlight() {
	d3.select(".lap-table tbody")
		.selectAll("tr")
		.classed("selected-row", d => selectedIds.has(d.id));
}

function drawLapTable(data, opts = {}) {
	const idKey = opts.idKey || "id";

	const root = d3.select("#container3");
	root.selectAll(".lap-table-wrap").remove();

	const wrapper = root.append("div").attr("class", "lap-table-wrap")

	d3.select("#select-all-button").on("click", () => {
		data.forEach(r => selectedIds.add(r[idKey]));
		updateTableHighlight();
		renderRows();
		opts.onSelectionChange();
	});

	d3.select("#remove-all-button").on("click", () => {
		selectedIds.clear();
		updateTableHighlight();
		renderRows();
		opts.onSelectionChange();
	});


	const scroller = wrapper.append("div").attr("class", "lap-table-scroller");

	const columnDefs = [
		{ key: "__select__", label: "✔", width: vwToPx(2) },
		{ key: "id", label: "ID", width: vwToPx(2.3) },
		{ key: "Driver", label: "Driver", width: vwToPx(3.2) },
		{ key: "Team", label: "Team", width: vwToPx(3) },
		{ key: "Track", label: "Track", width: vwToPx(4) },
		{ key: "LapNumber", label: "Lap #", width: vwToPx(3) },
		{ key: "LapTime_norm", label: "LapTime*", width: vwToPx(4.5) },
		{ key: "LapTime_sec", label: "LapTime", width: vwToPx(4.2) },
		{ key: "Compound", label: "Tyre", width: vwToPx(2.6) },
		{ key: "TyreLife", label: "TyreLife", width: vwToPx(3.8) },
		{ key: "TrackTemp", label: "TrackTemp", width: vwToPx(4.7) },
		{ key: "Rainfall", label: "Weather", width: vwToPx(4) },
		{ key: 'Cluster', label: 'Cluster', width: vwToPx(3.5) }
	];

	const table = scroller.append("table").attr("class", "lap-table");
	const thead = table.append("thead");
	const tbody = table.append("tbody");

	table.selectAll("th").style("cursor","pointer");

	let sortKey = null;
	let sortAsc = true;

	const header = thead.append("tr").selectAll("th")
		.data(columnDefs)
		.enter()
		.append("th")
		.style("width", d => `${d.width}px`)
		.text(d => d.label)
		.on("click", function(event, elem) {
			if (sortKey === elem.key)
				sortAsc = !sortAsc;
			else
				{ sortKey = elem.key; sortAsc = true; }
			thead.selectAll("th").classed("sort-asc", false).classed("sort-desc", false);
			d3.select(this).classed(sortAsc ? "sort-asc" : "sort-desc", true);
			renderRows();
			scroller.node().scrollTop = 0;
		});

	function formatCell(d, col) {
		if (col.key === "__select__") {
			const checked = selectedIds.has(d[idKey]);
			return `<input type="checkbox" ${checked ? "checked" : ""} class="red-check" />`;
		}
		let value = d[col.key];
		if ((col.key == "LapTime_sec" || col.key == "LapTime_norm") && value != null)
			value = Number(value).toFixed(2) + " sec";
		if ((col.key == "LapNumber" || col.key == "TyreLife") && value != null)
			value = parseInt(value);
		if ((col.key == "TrackTemp") && value != null)
			value = value + " °C";
		if ((col.key == "Compound") && value != null)
			value = `<img src="${tyresImgs[value]}" style="width: ${vwToPx(1.4)}px; height: ${vwToPx(1.4)}px;" alt="${value}" />`;
		if ((col.key == "Team") && value != null)
			value = `<img src="${teamLogos[value]}" style="width: ${vwToPx(1.4)}px; height: ${vwToPx(1.4)}px;" alt="${value}" />`;
		if ((col.key == "Rainfall") && value != null)
			value = `<img src="${weatherIcons[String(value)]}" style="width: ${vwToPx(1.4)}px; height: ${vwToPx(1.4)}px;" alt="${value}" />`;
		return value;
	}

	function renderRows() {
		let rowsData = data.slice();
		if (sortKey) {
			rowsData.sort((a,b) => {
				if (sortKey == '__select__') {
					const aSel = selectedIds.has(a[idKey]) ? 0 : 1;
					const bSel = selectedIds.has(b[idKey]) ? 0 : 1;
					return sortAsc ? (aSel - bSel) : (bSel - aSel);
				}
				const va = a[sortKey], vb = b[sortKey];
				if (!isNaN(+va) && !isNaN(+vb)) return sortAsc ? (+va - +vb) : (+vb - +va);
				return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
			});
		}
		currentOrderedRows = rowsData.map(r => r[idKey]);

		const rows = tbody.selectAll("tr").data(rowsData, d => d['id'])
			.join(
				enter => enter.append("tr")
					.style("cursor", "pointer")
					.on("click", function(event, d) {
						if (event.target.tagName === "INPUT" && event.target.type === "checkbox")
							return;
						const curIndex = rowsData.findIndex(r => r[idKey] === d[idKey]);
						if (lastClickedIndexTable != null) {
							let start = 0, end = 0;
							for (let i = 0; i < currentOrderedRows.length; i++) {
								if (currentOrderedRows[i] === lastClickedIndexTable) start = i;
								if (currentOrderedRows[i] === curIndex) end = i;
							}
							const range = currentOrderedRows.slice(start, end+1);
							range.forEach(id => {
								const tr = tbody.selectAll("tr").filter(d => d[idKey] === id);
								const checkbox = tr.selectAll("td").filter(d => d.col && d.col.key === "__select__").select("input");
								checkbox.property("checked", true);
								selectedIds.add(id);
							});
							lastClickedIndexTable = null;
						} else {
							lastClickedIndexTable = curIndex;
							const tr = d3.select(this);
							const checkbox = tr.selectAll("td").filter(d => d.col && d.col.key === "__select__").select("input");
							checkbox.property("checked", true);
							selectedIds.add(d[idKey]);
						}
						updateTableHighlight();
						opts.onSelectionChange();
					})
					.call(tr => tr.selectAll("td")
						.data(row => columnDefs.map(col => ({ col, value: formatCell(row, col), row })))
						.join("td")
						.html(row => row.value)
					),
				update => update
					.call(tr => tr.selectAll("td")
						.data(row => columnDefs.map(col => ({ col, value: formatCell(row, col), row })))
						.join("td")
						.html(row => row.value)
					),
				exit => exit.remove()
			);
		rows.selectAll("td")
			.filter(d => d.col.key === "__select__").select("input")
			.on("change", function(event, d) {
				if (this.checked)
					selectedIds.add(d.row[idKey]);
				else
					selectedIds.delete(d.row[idKey]);
				updateTableHighlight();
				opts.onSelectionChange();
			});

		const allClusterCells = tbody.selectAll("td")
			.filter(d => d.col && d.col.key === "Cluster");

		allClusterCells.html(d => {
			if (d.row.id != null && idClusterMap[d.row.id] != null) {
				return `<span style="color: ${clusterColorMap[idClusterMap[d.row.id]]}">${idClusterMap[d.row.id] + 1}</span>`;
			} else {
				return null;
			}

		});

		tbody.selectAll("tr").order();


	}

	function setSelection() {
		const tr = tbody.selectAll("tr").classed("selected", d => selectedIds.has(d[idKey]));
		const checkbox = tr.selectAll("td")
			.filter(d => d.col && d.col.key === "__select__")
			.select("input");
		checkbox.property("checked", d => selectedIds.has(d.row[idKey]));


		const allClusterCells = tbody.selectAll("td")
			.filter(d => d.col && d.col.key === "Cluster");

		allClusterCells.html(d => {
			if (d.row.id != null && idClusterMap[d.row.id] != null) {
				return `<span style="color: ${clusterColorMap[idClusterMap[d.row.id]]}">${idClusterMap[d.row.id] + 1}</span>`;
			} else {
				return null;
			}

		});


		updateTableHighlight();
		if (selectedIds.size > 0) {
			const first = Array.from(selectedIds)[0];
			const rowNode = tbody.selectAll("tr").filter(d => d[idKey] === first).node();
			if (rowNode) {
				const sc = scroller.node();
				const top = rowNode.offsetTop;
				sc.scrollTop = Math.max(0, top - 10);
			}
		}
	}

	renderRows();
	// get th with value 'id' and click on it
	d3.select(thead.selectAll("th").nodes().find(th => th.textContent === "ID")).dispatch("click");
	return {
		setSelection
	};
}
