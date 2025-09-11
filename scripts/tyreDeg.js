

let tyreInfoShown = false;

d3.select("#info-icon-tyre").on("click", () => {
	if (tyreInfoShown) {
		d3.select("#info-container-tyre").style("display", "none");
		d3.select("#container4 svg").style("display", "block");
		tyreInfoShown = false;
	} else {
		d3.select("#info-container-tyre").style("display", "flex");
		d3.select("#container4 svg").style("display", "none");
		tyreInfoShown = true;
	}
});


function drawTyreWearLinePlot(data, opts = {}) {
	const width = vwToPx(37);
	const height = vhToPx(29);
	const margin = { top: vhToPx(1), right: vwToPx(2.3), bottom: vhToPx(3.5), left: vwToPx(2.8) };

	const tyreKey = "TyreLife";            // x for regression scatter
	const timeKey = "LapTime_norm";       // y for regression scatter
	const compoundKey = "Compound";
	const idKey = "id";

	const binsCount = opts.binsCount || 12;
	let regressionType = "linear"; // "linear" or "robust"
	const maxScatterPerCompound = opts.maxScatterPerCompound || 10000;

	const cleanNum = v => {
		const n = (v === null || v === undefined) ? NaN : +v;
		return Number.isFinite(n) ? n : NaN;
	};

	const root = d3.select("#container4");
	root.selectAll("svg").remove();
	root.selectAll(".no-data").remove();
	const svg = root.append("svg").attr("width", width).attr("height", height);

	const rootControls = d3.select("#container4b");
	rootControls.selectAll(".tyre-settings").remove();
	const settings = rootControls.append("div").attr("class", "tyre-settings");
	settings.selectAll(".tyre-controls").remove();
	settings.selectAll(".tyre-legend-right-inset").remove();

	const controlsDiv = settings.append("div").attr("class", "tyre-controls");
	controlsDiv.html(`
		<label style='font-size:${vwToPx(0.8)};'>Regression type:
			<select id="regTypeSelect" style="margin-top:4px;font-size:${vwToPx(0.8)};">
				<option style='font-size:${vwToPx(0.8)}' value="linear">Linear</option>
				<option style='font-size:${vwToPx(0.8)}' value="robust">Robust (Theil-Sen)</option>
			</select>
		</label>
	`);

	controlsDiv.select("#regTypeSelect").property("value", regressionType);

	const rowsAll = data.map(r => ({
		orig: r,
		tyre: cleanNum(r[tyreKey]),
		time: cleanNum(r[timeKey]),
		compound: r[compoundKey],
		id: r[idKey] != null ? r[idKey] : (r.__lap_id != null ? r.__lap_id : r.id)
	})).filter(d => isFinite(d.tyre) && isFinite(d.time) && d.compound != null);

	if (rowsAll.length === 0) {
		root.append("div").attr('class', 'no-data').text("No data for TyreLife vs LapTime plot");
		return { updateSelection: () => {} };
	}

	const compoundsMap = d3.group(rowsAll, d => d.compound);
	const compounds = Array.from(compoundsMap, ([cmp, arr]) => ({ compound: cmp, rows: arr }));

	// (3) [{…}, {…}, {…}]
	// 0 : {compound: 'INTERMEDIATE', rows: Array(511)}
	// 1 : {compound: 'MEDIUM', rows: Array(133)}
	// 2 : {compound: 'HARD', rows: Array(356)}

	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	// scales
	const x = d3.scaleLinear()
		.domain(d3.extent(rowsAll, d => d.tyre)).nice()
		.range([0, innerW]);

	const y = d3.scaleLinear()
		.domain(d3.extent(rowsAll, d => d.time)).nice()
		.range([innerH * 0.92, 0]);


	const color = d3.scaleOrdinal()
		.domain(["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"])
		.range(["#de0000ff", "#d7d700ff", "#FFFFFF", "#009200ff", "#0000d2ff"]);


	const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	// axes
	g.append("g").attr("transform", `translate(0,${innerH * 0.92})`).call(d3.axisBottom(x).ticks(8));
	g.append("g").attr("class", "y-axis").call(d3.axisLeft(y).ticks(6));

	// axis labels
	g.append("text").attr("x", innerW / 2).attr("y", height - margin.bottom / 2).attr("text-anchor", "middle")
		.style("font-size", "11.5px").style("fill", "var(--whiteCustom)").text("TyreLife");
	g.append("text").attr("transform", `translate(${-margin.left + 12}, ${innerH/2}) rotate(-90)`)
		.attr("text-anchor", "middle").style("font-size", "11.5px").style("fill", "var(--whiteCustom)")
		.text("LapTime*");

	// clip (main chart area)
	g.append("defs").append("clipPath").attr("id","tyre-clip")
		.append("rect").attr("width", innerW).attr("height", innerH * 0.92);
	const mainG = g.append("g").attr("clip-path","url(#tyre-clip)");


	// prepare binned means per compound
	function computeBinnedStats(rows, binsCountLocal = binsCount) {
		const tyreVals = rows.map(r => +r.tyre).filter(v => !isNaN(v));
		if (tyreVals.length === 0){
			console.log("No tyre values in rows:", rows);
			return [];
		}

		// Divide  TyreLife (tyre) in bins (intervalli) and compute mean TyreLife, mean LapTime, stddev LapTime per bin
		const extent = d3.extent(tyreVals);
		// se tutti i tyre sono uguali, crea un unico "bin" con tutti i punti
		if (extent[0] === extent[1]) {
			const meanTyre = d3.mean(rows, d => +d.tyre);
			const meanTime = d3.mean(rows, d => +d.time);
			const stdTime = d3.deviation(rows, d => +d.time) || 0;
			return [{ centre: meanTyre, mean: meanTime, std: stdTime, rows: rows.slice() }];
		}

		const binGen = d3.bin().domain(d3.extent(tyreVals)).thresholds(binsCountLocal).value(d => d);

		// we need original rows per bin, so create custom bins: use numeric tyre value then map rows
		const thresholds = binGen(tyreVals).map(b => b.x0).concat([d3.extent(tyreVals)[1]]);
		const bins = d3.bin().domain(d3.extent(tyreVals)).thresholds(thresholds).value(d => d.tyre)(rows);
		return bins.map(bin => {
			const meanTyre = d3.mean(bin, d => d.tyre);
			const meanTime = d3.mean(bin, d => d.time);
			const stdTime = d3.deviation(bin, d => d.time) || 0;
			return { centre: meanTyre, mean: meanTime, std: stdTime, rows: bin };
		}).filter(b => b.rows.length > 0).sort((a,b) => a.centre - b.centre);
	}

	// line & area gens (for binned means)
	const lineGen = d3.line().x(d => x(d.centre)).y(d => y(d.mean)).curve(d3.curveMonotoneX);
	const areaGen = d3.area().x(d => x(d.centre)).y0(d => y(d.mean - d.std)).y1(d => y(d.mean + d.std)).curve(d3.curveMonotoneX);

	mainG.selectAll(".compound-g").data(compounds, d => d.compound).enter().append("g").attr("class","compound-g");

	function redrawCompoundLayers(setIds) {
		mainG.selectAll(".compound-g").each(function(c) {
			const container = d3.select(this);
			const rowsToUse = c.rows.filter(r => setIds.has(r.id))
			const bins = computeBinnedStats(rowsToUse);
			container.selectAll(".area").remove();
			container.selectAll(".mean-line").remove();
			container.selectAll(".mean-point").remove();

			if (!bins || bins.length === 0) {
				container.attr("opacity", 0.12);
				container.text("No data");
				return;
			} else {
				container.attr("opacity", 1);
			}

			container.append("path")
				.attr("class","area")
				.attr("d", areaGen(bins))
				.attr("fill", color(c.compound))
				.attr("opacity", 0.22);

			container.append("path")
				.attr("class","mean-line")
				.attr("d", lineGen(bins))
				.attr("stroke", color(c.compound))
				.attr("stroke-width", 1.8)
				.attr("fill", "none")
				.style("pointer-events", "none");

			container.selectAll(".mean-point")
				.data(bins)
				.enter()
				.append("circle")
				.attr("class","mean-point")
				.attr("cx", d => x(d.centre))
				.attr("cy", d => y(d.mean))
				.attr("r", 2.5)
				.attr("fill", color(c.compound))
				.attr("opacity", 1)
				.style("pointer-events", "none");
		});
	}


	const stripH = innerH * 0.12;
	const stripY = innerH * 0.8;

	const xDomain = x.domain();
	if (xDomain[0] === undefined || xDomain[1] === undefined) {
		console.warn("x domain not ready, skipping strip");
	} else {
		const tyreVals = rowsAll.map(d => d.tyre).filter(v => isFinite(v));
		if (tyreVals.length > 0) {
			const tyreBins = d3.bin()
			.domain(xDomain)
			.thresholds(binsCount || 12)
			(tyreVals);

			const counts = tyreBins.map(b => b.length);
			const maxCount = d3.max(counts) || 1;
			const stripScaleH = d3.scaleLinear().domain([0, maxCount]).range([0, stripH]);

			const stripG = g.append("g").attr("transform", `translate(0,${stripY})`);

			stripG.selectAll("rect")
				.data(tyreBins)
				.enter()
				.append("rect")
				.attr("x", d => x(d.x0))
				.attr("y", d => stripH - stripScaleH(d.length))
				.attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
				.attr("height", d => stripScaleH(d.length))
				.attr("fill", "#ccc")
				.attr("opacity", 0.3)
				.append("title")
				.text(d => `count: ${d.length}`);
		}
	}

	// Regressione lineare classica (OLS - Ordinary Least Squares)
	// Trova la retta che minimizza la somma dei quadrati degli errori.
	// È veloce ma sensibile agli outlier.
	function linearRegression(xs, ys) {
		const n = xs.length; if (n === 0) return null;
		const xmean = d3.mean(xs), ymean = d3.mean(ys);
		let num = 0, den = 0;
		for (let i=0;i<n;i++){ num += (xs[i]-xmean)*(ys[i]-ymean); den += (xs[i]-xmean)*(xs[i]-xmean); }
		const slope = den === 0 ? 0 : num / den;
		const intercept = ymean - slope * xmean;
		let ssRes = 0, ssTot = 0;
		for (let i=0;i<n;i++){
			const yPred = slope * xs[i] + intercept;
			ssRes += (ys[i] - yPred) * (ys[i] - yPred);
			ssTot += (ys[i] - ymean) * (ys[i] - ymean);
		}
		const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
		return { slope, intercept, r2 };
	}

	// Regressione robusta (Theil–Sen estimator)
	// Usa la mediana delle pendenze tra tutte (o molte) coppie di punti.
	// Più robusta agli outlier rispetto a OLS, ma più lenta su dataset grandi.
	function theilSen(xs, ys) {
		const n = xs.length; if (n === 0) return null;
		const slopes = []; const MAX_PAIRS = 10000;
		if (n*(n-1)/2 <= MAX_PAIRS) {
			for (let i=0;i<n;i++) for (let j=i+1;j<n;j++){
				const dx = xs[j]-xs[i]; if (dx !== 0) slopes.push((ys[j]-ys[i]) / dx);
			}
		} else {
			const tries = Math.min(MAX_PAIRS, n*50);
			for (let t=0;t<tries;t++){
				const i = Math.floor(Math.random()*n);
				let j = Math.floor(Math.random()*n); while (j===i) j = Math.floor(Math.random()*n);
				const dx = xs[j]-xs[i]; if (dx !== 0) slopes.push((ys[j]-ys[i]) / dx);
			}
		}
		if (slopes.length === 0) return linearRegression(xs, ys);
			const slope = d3.median(slopes);
			const intercept = d3.median(xs.map((x,i) => ys[i] - slope * x));
			let ssRes = 0, ssTot = 0; const ymean = d3.mean(ys);
		for (let i=0;i<n;i++){
			const yPred = slope * xs[i] + intercept;
			ssRes += (ys[i] - yPred) * (ys[i] - yPred);
			ssTot += (ys[i] - ymean) * (ys[i] - ymean);
		}
		const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
		return { slope, intercept, r2 };
	}

	function drawInlineRegressions(selectedIdsSet = null) {
		mainG.selectAll(".inline-regline").remove();
		const meta = [];
		const xDomain = x.domain();
		if (selectedIdsSet == null || (selectedIdsSet !== null && selectedIdsSet.size === 0))
			return;

		compounds.forEach((c) => {
			const candidateRows = (selectedIdsSet ? c.rows.filter(r => selectedIdsSet.has(r.id)) : c.rows).filter(r => isFinite(r.time) && isFinite(r.tyre));
			if (candidateRows.length < 2) return;

			// const sample = candidateRows.length > 800 ? d3.shuffle(candidateRows).slice(0,800) : candidateRows;
			const sample = candidateRows;
			const xs = sample.map(d => d.tyre), ys = sample.map(d => d.time);
			const reg = (regressionType === "robust") ? theilSen(xs, ys) : linearRegression(xs, ys);
			if (!reg) return;

			// compute y at domain extremes to draw line
			const x0 = xDomain[0], x1 = xDomain[1];
			const y0 = reg.slope * x0 + reg.intercept;
			const y1 = reg.slope * x1 + reg.intercept;

			// append line to mainG (so it's drawn over areas/means & under scatter points — choose z-order)
			mainG.append("line")
				.attr("class", "inline-regline")
				.attr("x1", x(x0)).attr("y1", y(y0))
				.attr("x2", x(x1)).attr("y2", y(y1))
				.attr("stroke", color(c.compound))
				.attr("stroke-width", 2.4)
				.attr("opacity", 0.85)
				.attr("stroke-dasharray", "6,4")
				.style("pointer-events", "none");

			// create group in svg (not clipped) so label can overflow
			svg.append("g")
				.attr("opacity", 0.95)
				.style("dominant-baseline", "middle")
				.style("pointer-events", "none");

			meta.push({ compound: c.compound, slope: reg.slope, r2: reg.r2, color: color(c.compound), rows: candidateRows });
		});
		settings.selectAll(".tyre-legend-right-inset").remove();
		const legendDiv = settings.append("div").attr("class","tyre-legend-right-inset");
		meta.forEach((m) => {
			const times = m.rows.map(r => r.time).filter(v => isFinite(v));
    		const meanTime = times.length > 0 ? d3.mean(times) : null;

			legendDiv.append("div")
				.style("display","flex")
				.style("align-items","center")
				.style("margin-top","4px")
				.html(`<div style="width:12px;height:12px;background:${m.color};opacity:0.9;border-radius:2px;margin-right:2px"></div>
					<div style="margin-left:4px">
						${m.slope.toFixed(3)}s/lap | R²
						${m.r2.toFixed(3)} | Mean:
						${meanTime ? meanTime.toFixed(3) : "N/A"}s
					</div>`
				);
		});
	}
	// 						<span style='font-weight:bold'>${pcAxisMapCaps[m.compound]}:</span>

	// create set of ids of data
	const dataIds = new Set(rowsAll.map(r => r.id));
	drawInlineRegressions(dataIds);
	redrawCompoundLayers(dataIds);

	const regSelect = controlsDiv.select("#regTypeSelect");

	regSelect.on("change", () => {
		// if selectedIds is empty:
		regressionType = regSelect.property("value");
		if (selectedIds == null || (selectedIds !== null && selectedIds.size === 0)) {
			drawInlineRegressions(dataIds);
		}
		else {
			drawInlineRegressions(selectedIds);
		}
	});

	// selection API
	const api = {
		updateSelection() {
			if (selectedIds == null || (selectedIds !== null && selectedIds.size === 0)) {
				drawInlineRegressions(dataIds);
				redrawCompoundLayers(dataIds);
			} else {
				drawInlineRegressions(selectedIds);
				redrawCompoundLayers(selectedIds);
			}
		}
	};

	return api;
}
