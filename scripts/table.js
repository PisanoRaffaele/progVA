// Aggiorna la tabella evidenziando le righe selezionate
function updateTableHighlight(selectedLaps) {
	d3.select(".lap-table tbody")
		.selectAll("tr")
		.classed("selected-row", d => selectedLaps.includes(d.id));
}


function drawLapTable(data, opts = {}) {
	const idKey = opts.idKey || "id";
	// const onRowClick = opts.onRowClick;
	const onRowClick = function(id, event, row) { console.log("Row clicked:", id, row); };

	const root = d3.select("#container3");
	root.selectAll("*").remove();

	const wrapper = root.append("div").attr("class", "lap-table-wrap")
	const scroller = wrapper.append("div").attr("class", "lap-table-scroller");

	const columnDefs = [
		{ key: "id", label: "ID", width: "35px" },
		{ key: "Driver", label: "Driver", width: "50px" },
		{ key: "Team", label: "Team", width: "60px" },
		{ key: "LapNumber", label: "Lap #", width: "50px" },
		{ key: "LapTime_norm", label: "LapTime*", width: "65px" },
		{ key: "LapTime_sec", label: "LapTime", width: "65px" },
		{ key: "Compound", label: "Tyre", width: "40px" },
		{ key: "TyreLife", label: "TyreLife", width: "50px" },
		{ key: "TrackTemp", label: "Track Temp", width: "65px" },
		{ key: "Rainfall", label: "Weather", width: "50px" }
	];

	const table = scroller.append("table").attr("class", "lap-table");
	const thead = table.append("thead");
	const tbody = table.append("tbody");

	table.selectAll("th").style("cursor","pointer");

	let sortKey = null;
	let sortAsc = true;

	const header = thead.append("tr")
		.selectAll("th")
		.data(columnDefs)
		.enter()
		.append("th")
		.style("width", d => d.width)
		.text(d => d.label)
		.on("click", function(event, elem) {
			console.log("Header clicked:", elem.key);
			if (sortKey === elem.key) sortAsc = !sortAsc;
			else { sortKey = elem.key; sortAsc = true; }
			thead.selectAll("th").classed("sort-asc", false).classed("sort-desc", false);
			d3.select(this).classed(sortAsc ? "sort-asc" : "sort-desc", true);
			renderRows();
			scroller.node().scrollTop = 0;
		});

	let lastClickedIndex = null;

	function formatCell(d, col) {
		let value = d[col.key];

		if ((col.key == "LapTime_sec" || col.key == "LapTime_norm") && value != null) 
			value = Number(value).toFixed(2) + " sec";

		if ((col.key == "LapNumber" || col.key == "TyreLife") && value != null) 
			value = parseInt(value);
				
		if ((col.key == "TrackTemp") && value != null) 
			value = value + " °C";
				
		if ((col.key == "Compound") && value != null) 
			value = `<img src="${tyresImgs[value]}" style="width: 20px; height: 20px;" alt="${value}" />`;
				
		if ((col.key == "Team") && value != null) 
			value = `<img src="${teamLogos[value]}" style="width: 20px; height: 20px;" alt="${value}" />`;
				
		if ((col.key == "Rainfall") && value != null) 
			value = `<img src="${weatherIcons[String(value)]}" style="width: 20px; height: 20px;" alt="${value}" />`;

		return value;
	}

	function renderRows() {
		let rowsData = data.slice();
		if (sortKey) {
			rowsData.sort((a,b) => {
				const va = a[sortKey], vb = b[sortKey];
				if (va == null && vb == null) return 0;
				if (va == null) return 1;
				if (vb == null) return -1;
				if (!isNaN(+va) && !isNaN(+vb)) return sortAsc ? (+va - +vb) : (+vb - +va);
				return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
			});
		}

		const rows = tbody.selectAll("tr").data(rowsData, d => d['id'])
			.join(
				enter => enter.append("tr")
					.style("cursor", "pointer")
					.on("click", function(event, d) {
						console.log("Row clicked:", d);
						const curIndex = rowsData.findIndex(r => r[idKey] === d[idKey]);
						if (event.shiftKey && lastClickedIndex != null) {
							const [lo, hi] = curIndex > lastClickedIndex ? [lastClickedIndex, curIndex] : [curIndex, lastClickedIndex];
							const range = rowsData.slice(lo, hi+1).map(r => r[idKey]);
							updateTableHighlight(range);
							if (onRowClick) {
								range.forEach(id => onRowClick(id, event, data.find(x => x[idKey]===id)));
							}
						} else {
							lastClickedIndex = curIndex;
							if (onRowClick) onRowClick(d[idKey], event, d);
						}
					})
					.call(tr => tr.selectAll("td")
						.data(d => columnDefs.map(col => ({ col, value: formatCell(d, col) })))
						.join("td")
						.html(d => d.value)
					),
				update => update
					.call(tr => tr.selectAll("td")
						.data(d => columnDefs.map(col => ({ col, value: formatCell(d, col) })))
						.join("td")
						.html(d => d.value)
					),
				exit => exit.remove()
			);

		tbody.selectAll("tr").order();

		// highlight selected rows (table-level selection set will be managed by outer code)
		updateRowSelection();
	}

	// helper to get all ids in table order
	function getAllIds() {
		const rowsData = tbody.selectAll("tr").data();
		return rowsData.map(r => r[idKey]);
	}

	// expose method to set selection (apply class .selected on selected rows)
	function setSelection(ids = []) {
		const sel = new Set(ids);
		tbody.selectAll("tr").classed("selected", d => sel.has(d[idKey]))
			.style("background", d => sel.has(d[idKey]) ? "rgba(255,255,0,0.08)" : null);
		// scroll first selected into view (optional)
		if (ids.length > 0) {
			const first = ids[0];
			const rowNode = tbody.selectAll("tr").filter(d => d[idKey] === first).node();
			if (rowNode) {
				const sc = scroller.node();
				const top = rowNode.offsetTop;
				sc.scrollTop = Math.max(0, top - 10);
			}
		}
	}

	function updateRowSelection() {
		// stub per eventuali aggiornamenti (viene gestito esternamente con setSelection)
	}

	// initial render
	renderRows();

	// return api
	return {
		setSelection,
		getAllIds,
		_lastClickedId: null
	};
}
