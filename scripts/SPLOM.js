let splomInfoShown = false;

d3.select("#info-icon-splom").on("click", () => {
	if (splomInfoShown) {
		d3.select("#info-container-splom").style("display", "none");
		d3.select("#splom").style("display", "flex");
		d3.select("#pairView").style("display", "none");
		splomInfoShown = false;
	} else {
		d3.select("#info-container-splom").style("display", "flex");
		d3.select("#splom").style("display", "none");
		d3.select("#pairView").style("display", "none");
		splomInfoShown = true;
	}
});



const workerCodeSPLOM = `
// LTTB implementation (returns array of indices from original points)
function largestTriangleThreeBuckets(data, threshold) {
  // data: [{x,y}], threshold: integer >= 3
  const n = data.length;
  if (threshold >= n || threshold === 0) return data.map((d,i) => i); // return all indices
  if (threshold === 1) return [Math.floor(n/2)];

  const sampled = new Array(threshold);
  // Always include first and last
  sampled[0] = 0;
  sampled[threshold - 1] = n - 1;

  const bucketSize = (n - 2) / (threshold - 2);
  let a = 0; // a is index of previously selected point
  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor(1 + i * bucketSize);
    const bucketEnd = Math.floor(1 + (i + 1) * bucketSize);
    // calculate avg x,y for next bucket
    let avgX = 0, avgY = 0, avgCount = 0;
    const nextBucketStart = Math.floor(1 + (i + 1) * bucketSize);
    const nextBucketEnd = Math.floor(1 + (i + 2) * bucketSize);
    const nbStart = nextBucketStart;
    const nbEnd = Math.min(n - 1, nextBucketEnd);
    for (let j = nbStart; j < nbEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
      avgCount++;
    }
    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    } else {
      avgX = data[Math.min(n-1, bucketEnd)].x;
      avgY = data[Math.min(n-1, bucketEnd)].y;
    }

    // find point in this bucket that forms the largest triangle
    let maxArea = -1;
    let maxIndex = bucketStart;
    for (let j = bucketStart; j < bucketEnd && j < n - 1; j++) {
      // area = abs((Ax - Cx)*(By - Ay) - (Ax - Bx)*(Cy - Ay)) / 2
      const ax = data[a].x, ay = data[a].y;
      const bx = data[j].x, by = data[j].y;
      const cx = avgX, cy = avgY;
      const area = Math.abs((ax - cx)*(by - ay) - (ax - bx)*(cy - ay)) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }
    sampled[i+1] = maxIndex;
    a = maxIndex;
  }
  return sampled;
}

// Cache: key = xVar + '|' + yVar + '|' + threshold
const cache = new Map();
let rawData = null;

function coerceValue(v) {
  if (v === null || v === undefined) return NaN;
  const n = +v;
  return Number.isFinite(n) ? n : NaN;
}

self.onmessage = function(e) {
	const msg = e.data;
	if (!msg || !msg.type) return;
	if (msg.type === 'init') {
		rawData = Array.isArray(msg.data) ? msg.data : Array.from(msg.data || []);
		cache.clear();
		self.postMessage({type:'inited', length: rawData.length});
	} else if (msg.type === 'samplePair') {
		const { xVar, yVar, threshold = 2000 } = msg;
		const cacheKey = xVar + '|' + yVar + '|' + threshold;
		if (cache.has(cacheKey)) {
			self.postMessage({ type: 'sampleResult', xVar, yVar, threshold, ...cache.get(cacheKey) });
			return;
		}
		if (!rawData) {
			self.postMessage({ type:'error', message:'no data initialized' });
			return;
		}
		// build array of points with original index
		const pts = [];
		for (let i = 0; i < rawData.length; i++) {
			const row = rawData[i];
			const x = coerceValue(row[xVar] !== undefined ? row[xVar] : row[xVar && xVar.toLowerCase ? xVar.toLowerCase() : xVar]);
			const y = coerceValue(row[yVar] !== undefined ? row[yVar] : row[yVar && yVar.toLowerCase ? yVar.toLowerCase() : yVar]);
			const originalIndex = row.id !== undefined ? row.id : (row.ID !== undefined ? row.ID : i);
			if (Number.isFinite(x) && Number.isFinite(y)) {
				pts.push({ x, y, i, originalIndex, origRow: row });
			}
		}
		if (pts.length === 0) {
			const res = { points: [], total: 0 };
			cache.set(cacheKey, res);
			self.postMessage({ type: 'sampleResult', xVar, yVar, threshold, ...res });
			return;
		}
		// if threshold >= pts.length => return all points (but maybe cap to avoid huge messages)
		const finalThreshold = Math.min(threshold, pts.length);
		// create array of {x,y} for LTTB
		const arr = pts.map(p => ({ x: p.x, y: p.y }));
		let indices;
		if (finalThreshold >= pts.length) {
			indices = pts.map((p, idx) => idx);
		} else {
			indices = largestTriangleThreeBuckets(arr, finalThreshold);
		}
		// map indices (inside pts) back to actual points with original row index
		const sampledPoints = indices.map(idx => pts[idx]).map(p => ({x: p.x, y: p.y, origIndex: p.i, orig: p.origRow}));
		const result = { points: sampledPoints, total: pts.length };
		cache.set(cacheKey, result);
		self.postMessage({ type: 'sampleResult', xVar, yVar, threshold, ...result });
	} else if (msg.type === 'heatmap') {
		const { xVar, yVar, bins = 20 } = msg;
		const cacheKey =  'heatmap|' + xVar + '|' + yVar + '|' + bins;
		if (cache.has(cacheKey)) {
			self.postMessage({ type: 'heatmapResult', xVar, yVar, bins, ...cache.get(cacheKey) });
			return;
		}
		if (!rawData) {
			self.postMessage({ type:'error', message:'no data initialized' });
			return;
		}

		const pts = rawData.map(d => ({
			x: +d[xVar],
			y: +d[yVar]
		})).filter(d => isFinite(d.x) && isFinite(d.y));

		if(pts.length === 0) {
			self.postMessage({ type:'heatmapResult', xVar, yVar, data: [] });
			cache.set(cacheKey, { data: [] });
			return;
		}

		const xs = pts.map(p => p.x);
		const ys = pts.map(p => p.y);
		const xExtent = [Math.min(...xs), Math.max(...xs)];
		const yExtent = [Math.min(...ys), Math.max(...ys)];

		const heatData = [];
		for(let i=0;i<bins;i++){
			for(let j=0;j<bins;j++){
				heatData.push({i,j,count:0});
			}
		}

		pts.forEach(p=>{
			const ix = Math.floor((p.x - xExtent[0]) / (xExtent[1]-xExtent[0]) * bins);
			const iy = Math.floor((p.y - yExtent[0]) / (yExtent[1]-yExtent[0]) * bins);
			const ci = Math.min(bins-1, Math.max(0, ix));
			const cj = Math.min(bins-1, Math.max(0, iy));
			heatData[cj * bins + ci].count += 1;  // riga * bins + colonna
		});

		self.postMessage({type:'heatmapResult', xVar, yVar, bins, data: heatData, xExtent, yExtent});

		cache.set(cacheKey, { data: heatData, xExtent, yExtent });
	}
}`;

// create worker from blob
const workerBlob = new Blob([workerCodeSPLOM], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const lttbWorker = new Worker(workerUrl);

const totalCells = 25;
const allHeatResults = [];

lttbWorker.onmessage = function(e) {
	const msg = e.data;
	if (!msg) return;
	if (msg.type === 'inited') {
		//console.log('[worker] data loaded, rows:', msg.length);
	} else if (msg.type === 'sampleResult') {
		// handled in requestSample's callback (we use a promise map)
		const key = `${msg.xVar}|${msg.yVar}|${msg.threshold}`;
		if (pendingSampleRequests.has(key)) {
			const cb = pendingSampleRequests.get(key);
			pendingSampleRequests.delete(key);
		cb(null, msg);
		} else {
			// fallback log
			console.log('[worker] sampleResult (no handler):', msg);
		}
	} else if (msg.type === 'heatmapResult') {
		allHeatResults.push(msg);
		if (allHeatResults.length === totalCells) {
			const maxCount = d3.max(allHeatResults.flatMap(r => r.data.map(d => d.count)));
			const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, maxCount]);
			drawHeatmapLegend(colorScale, heatmapBins);
		}
        const key = `heat|${msg.xVar}|${msg.yVar}|${msg.bins}`;
        if (pendingSampleRequests.has(key)) {
            const cb = pendingSampleRequests.get(key);
            pendingSampleRequests.delete(key);
            cb(null, msg);
        } else {
            console.log('[worker] heatmapResult (no handler):', msg);
        }
    } else if (msg.type === 'error') {
		console.error('[worker] error:', msg.message);
	}
};

// map of pending requests (key -> callback)
const pendingSampleRequests = new Map();

function requestSampleFromWorker(xVar, yVar, threshold = 10000) {
	return new Promise((resolve, reject) => {
		const key = `${xVar}|${yVar}|${threshold}`;
		pendingSampleRequests.set(key, (err, res) => {
			if (err) reject(err); else resolve(res);
		});
		try {
			//console.log('[worker] requestSample:', xVar, yVar, threshold);
			lttbWorker.postMessage({ type: 'samplePair', xVar, yVar, threshold });
		} catch (err) {
			pendingSampleRequests.delete(key);
			reject(err);
		}
	});
}

function requestHeatmapFromWorker(xVar, yVar, bins = 20) {
    return new Promise((resolve, reject) => {
        const key = `heat|${xVar}|${yVar}|${bins}`;
        pendingSampleRequests.set(key, (err, res) => {
            if (err) reject(err); else resolve(res);
        });
        try {
            lttbWorker.postMessage({ type: 'heatmap', xVar, yVar, bins });
        } catch(err) {
            pendingSampleRequests.delete(key);
            reject(err);
        }
    });
}

function initSPLOM(opts={}) {
	const idKey = "id";
	const variables = ["LapTime_norm","LapNumber","TyreLife","TrackTemp","Rainfall"];
	const size = vwToPx(4.1);
	const padding = vwToPx(0.7);
	const units = {LapTime_norm:"s", LapNumber:"lap", TyreLife:"laps", "TrackTemp":"°C", "Rainfall":"bool"};
	const n = variables.length;

	const margin = { top: vhToPx(4), right: vwToPx(1.6), bottom: vhToPx(2.5), left: vwToPx(1.6) };
	const width = size * n + margin.left + margin.right;
	const height = size * n + margin.top + margin.bottom;

	d3.select("#splom").selectAll("svg").remove();
	const svg = d3.select("#splom")
		.append("svg").attr("width", width).attr("height", height);

	const gMain = svg.append("g").attr("class", "splom-main").attr("transform", `translate(${margin.left},${margin.top})`);

	const xScales = {};
	const yScales = {};
	variables.forEach(v => {
		xScales[v] = d3.scaleLinear().range([padding / 2, size - padding / 2]);
		yScales[v] = d3.scaleLinear().range([size - padding / 2, padding / 2]);
	});

	// defs + clipPaths per ogni cella
	const cellsCross = d3.cross(variables, variables);
	const defs = svg.append("defs");
	defs.selectAll("clipPath")
		.data(cellsCross)
		.enter()
		.append("clipPath")
		.attr("id", (d,i) => `cell-clip-${i}`)
		.append("rect")
		.attr("width", size)
		.attr("height", size)
		.attr("x", 0)
		.attr("y", 0);

	const cell = gMain.selectAll(".cell")
		.data(cellsCross)
		.enter()
		.append("g")
		.attr("class", "cell")
		.attr("transform", ([xVar, yVar], i) => {
			const col = variables.indexOf(xVar);
			const row = variables.indexOf(yVar);
			return `translate(${col * size},${row * size})`;
		});

	cell.style("cursor", "pointer")
	.on("mouseover", function() {
        d3.select(this).select("rect").attr("fill", "rgba(146, 147, 149, 0.1)");
    })
    .on("mouseout", function() {
        d3.select(this).select("rect").attr("fill", "none");
    })
    .on("click", function(event, d) {
		drawPairView(d[0], d[1], opts);
		d3.select("#splom").style("display", "none");
		d3.select("#pairView").style("display", "flex");
    });

	cell.append("rect")
		.attr("width", size)
		.attr("height", size)
		.attr("fill", "none")
		.attr("stroke", "var(--whiteCustom)")

	cell.append("g").attr("class", "points");

	// assi globali (uno per variabile, posizionati sotto / a sinistra del grid)
	const xAxisGroups = svg.append("g").attr("class", "x-axes");
	const yAxisGroups = svg.append("g").attr("class", "y-axes");

	// posiziona assi
	variables.forEach((v, i) => {
		xAxisGroups.append("g")
		.attr("class", `x axis axis-${i}`)
		.attr("transform", `translate(${margin.left + i * size},${margin.top + n * size})`);
	});
	variables.forEach((v, i) => {
		yAxisGroups.append("g")
		.attr("class", `y axis axis-${i}`)
		.attr("transform", `translate(${margin.left + n * size},${margin.top + i * size})`);
	});

	const colLabels = svg.append("g").attr("class", "col-labels");
	variables.forEach((v, i) => {
		const x = margin.left + i * size + size / 2;
		const y = margin.top / 2;
		colLabels.append("text")
			.attr("class", "col-label")
			.attr("x", x)
			.attr("y", y - 6)
			.attr("font-weight", "600")
			.attr("text-anchor", "middle")
			.attr("fill", "var(--whiteCustom)")
			.attr("font-size", vhToPx(1.5))
			.text(mapVars2[v]);
		colLabels.append("text")
			.attr("class", "col-unit")
			.attr("x", x)
			.attr("y", y + 8)
			.attr("text-anchor", "middle")
			.attr("font-size", vhToPx(1.5))
			.attr("fill", "var(--whiteCustom)")
			.text(units[v] ? `(${units[v]})` : "");
	});

	const rowLabels = svg.append("g").attr("class", "row-labels");
	variables.forEach((v, i) => {
		const cellCenterX = margin.left / 2;
    	const cellCenterY = margin.top + i * size + size / 2;

		rowLabels.append("text")
			.attr("class", "row-label")
			.attr("x", cellCenterX - 6)
			.attr("y", cellCenterY)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-weight", "600")
			.attr("fill", "var(--whiteCustom)")
			.attr("transform", `rotate(-90, ${cellCenterX - 6}, ${cellCenterY})`)
			.attr("font-size", vhToPx(1.5))
			.text(mapVars2[v]);

		rowLabels.append("text")
			.attr("class", "row-unit")
			.attr("x", cellCenterX + 8)
			.attr("y", cellCenterY)
			.attr("text-anchor", "middle")
			.attr("font-size", vhToPx(1.5))
			.attr("fill", "var(--whiteCustom)")
			.attr("transform", `rotate(-90, ${cellCenterX + 8}, ${cellCenterY})`)
			.text(units[v] ? `(${units[v]})` : "");
	});

	const api = {
		setSelection() {
			// const cellG = gMain.selectAll(".cell");
			// const pointsG = cellG.select(".points");
			// pointsG.selectAll("circle")
			// 	.attr("r", d => selectedIds.has((d.origIndex)) ? 2 : 1.5)
			// 	.attr("stroke", d => selectedIds.has((d.origIndex)) ? "#ff0" : "transparent")
			// 	.attr("opacity", d => selectedIds.has((d.origIndex)) ? 0.95 : 0.6)
			// 	.style("filter", d => selectedIds.has((d.origIndex)) ? "brightness(1.2)" : null);

			d3.select("#pairView").selectAll("circle")
				.attr("r", d => selectedIds.has((d.orig['id'])) ? 3.5 : 2.5)
				.attr("stroke", d => selectedIds.has((d.orig['id'])) ? "#ff0" : "#222")
				.attr("opacity", d => selectedIds.has((d.orig['id'])) ? 0.95 : 0.6)
				.style("filter", d => selectedIds.has((d.orig['id'])) ? "brightness(1.2)" : null);

			if (colorBy == null || colorBy == 'none') {
				d3.select("#pairView").selectAll("circle").attr('fill', "var(--azureCustom)");
			} else if (colorBy === 'team') {
				d3.select("#pairView").selectAll("circle").attr('fill', d => teamColorMap[d.orig['Team']]);
			} else if (colorBy === 'track') {
				d3.select("#pairView").selectAll("circle").attr('fill', d => trackColorMap[d.orig['Track']]);
			} else if (colorBy === 'cluster') {
				d3.select("#pairView").selectAll("circle").attr('fill', d => clusterColorMap[idClusterMap[d.orig['id']]]);
			}

			// porta in primo piano i selezionati
			d3.select("#pairView").selectAll("circle")
				.filter(d => selectedIds.has((d.orig['id'])))
				.raise();

		}
	};


	// ritorniamo un oggetto con funzioni e references utili per l'update
	return {
		svg, gMain, cell, xScales, yScales, xAxisGroups, yAxisGroups, variables, size, padding, margin,
		update: function(data) { updateSPLOM(data, this); },
		renderCellPoints: renderCellPoints,
		setSelection: api.setSelection,
	};
}

function updateSPLOM(rawData, context) {

	const { variables, size, padding, xScales, yScales, xAxisGroups, yAxisGroups, gMain, margin } = context;

	lttbWorker.postMessage({ type: 'init', data: rawData });

	// coerce numeri in proprietà con lo stesso nome di `variables` (local copy for extents)
	const coerced = rawData.map(d => {
		const o = {};
		variables.forEach(v => {
		const val = d[v] !== undefined ? d[v] : (d[v.toLowerCase()] !== undefined ? d[v.toLowerCase()] : undefined);
		o[v] = val == null ? NaN : +val;
		});
		o.__orig = d;
		return o;
	});

	variables.forEach(v => {
		const vals = coerced.map(d => d[v]).filter(x => isFinite(x));
		if (vals.length === 0) {
			xScales[v].domain([0,1]);
			yScales[v].domain([0,1]);
		} else {
			let domain = d3.extent(vals);
			if (domain[0] === domain[1])
				domain = [domain[0] - 1, domain[1] + 1];
			xScales[v].domain(domain).nice();
			yScales[v].domain(domain).nice();
		}
	});

	const ticksPerVar = {
		LapTime_norm: 4,
		LapNumber: 4,
		TyreLife: 4,
		TrackTemp: 3,
		Rainfall: 1
	};

	variables.forEach((v,i) => {
		const xAxis = d3.axisBottom(xScales[v]).ticks(ticksPerVar[v]);
		const yAxis = d3.axisRight(yScales[v]).ticks(ticksPerVar[v]);

		xAxisGroups.select(`.axis-${i}`)
			.transition().duration(300)
			.call(xAxis);

		yAxisGroups.select(`.axis-${i}`)
			.transition().duration(300)
			.call(yAxis);
	});
}

function renderCellPoints(xVar, yVar, cellIndex, threshold = 1000, context = SPLOMContext) {
	const { gMain, variables, size } = context;
	const cellG = gMain.selectAll(".cell").filter((d, i) => i === cellIndex);
	if (cellG.empty()) {
		console.warn("renderCellPoints: cell non trovata per index", cellIndex);
		return;
	}

	cellG.selectAll(".loading").remove();
	cellG.append("text").attr("class","loading").attr("x", 6).attr("y", 12).text("loading...").attr("font-size",vhToPx(1.4)).attr("fill","#666");

	requestSampleFromWorker(xVar, yVar, threshold).then(res => {
		cellG.selectAll(".loading").remove();
		const pointsG = cellG.select(".points");
		pointsG.selectAll("circle").remove();
		if (!res || res.total === 0 || !res.points || res.points.length === 0) {
			pointsG.append("text").attr("x", size/2).attr("y", size/2).attr("text-anchor","middle")
				.attr("dominant-baseline","middle").attr("font-size",vhToPx(1.4)).attr("fill","#999").text("no data");
			return;
		}
		pointsG.selectAll("circle")
			.data(res.points)
			.enter()
			.append("circle")
			.attr("cx", d => context.xScales[xVar](d.x))
			.attr("cy", d => context.yScales[yVar](d.y))
			.attr("r", 1.5)
			.attr("fill", "var(--azureCustom)")
			.attr("stroke", "transparent")
			.attr("clip-path", `url(#cell-clip-${cellIndex})`);
	}).catch(err => {
		cellG.selectAll(".loading").remove();
		console.error("renderCellPoints: worker error", err);
	});
}

function renderAllCellPoints(context = SPLOMContext, threshold = 1000) {
	//console.log("Rendering all cell points with threshold:", threshold);
	const { gMain, variables, size } = context;
	const cellG = gMain.selectAll(".cell");
	cellG.each(function(d, i) {
		var xVar = d[0];
		var yVar = d[1];
		renderCellPoints(xVar, yVar, i, threshold, context);
	});
}

function drawPairView(xVar, yVar, opts={}) {
	const container = d3.select("#pairView");
	container.selectAll("*").remove();
	const W = vwToPx(23.5), H = vwToPx(22.5);
	const padRight = vwToPx(1), padLeft = vwToPx(2.5), padTop = vhToPx(2.3), padBottom = vhToPx(5);
	const svg = container.append("svg").attr("width", W).attr("height", H);

	var div = container.append("div").attr("id", "backToSPLOM");
	var div2 = div.append("div").attr("class", "back-icon-div")
		.append("span").attr("class", "back-icon").html("&#x21A9;");

	div.style("transform", `translateX(-${vwToPx(1.2)}px)`);

	div.on("click", function() {
		d3.select("#splom").style("display", "flex");
		d3.select("#pairView").style("display", "none");
	});

	svg.append("text").attr("x", W/2).attr("y", H/2).attr("text-anchor","middle").text("loading...").attr("font-size",vhToPx(1.6)).attr("fill","#666");

	requestSampleFromWorker(xVar, yVar).then(res => {
		svg.selectAll("text").remove();
		if (!res || res.total === 0 || !res.points || res.points.length === 0) {
			svg.append("text").attr("x", W/2).attr("y", H/2).attr("text-anchor","middle").text("no data").attr("fill", "white");
			return;
		}
		const xExtent = d3.extent(res.points, d => d.x);
		const yExtent = d3.extent(res.points, d => d.y);
		if (xExtent[0] === xExtent[1])
			xExtent[0] -=1, xExtent[1]+=1;
		if (yExtent[0] === yExtent[1])
			yExtent[0] -=1, yExtent[1]+=1;

		const xScale = d3.scaleLinear().domain(xExtent).nice().range([padLeft, W - padRight]);
		const yScale = d3.scaleLinear().domain(yExtent).nice().range([H - padBottom, padTop]);

		svg.append("g").attr("transform", `translate(0,${H - padBottom})`).call(d3.axisBottom(xScale).ticks(6));
		svg.append("g").attr("transform", `translate(${padLeft},0)`).call(d3.axisLeft(yScale).ticks(6));

		svg.append("text")
			.attr("x", W / 2)
			.attr("y", H - (padBottom / 4))
			.attr("text-anchor", "middle")
			.attr("font-size", vhToPx(1.5))
			.attr("fill", "var(--whiteCustom)")
			.text(mapVars[xVar]);

		svg.append("text")
			.attr("transform", `rotate(-90)`)
			.attr("x", -H / 2)
			.attr("y", 8)
			.attr("text-anchor", "middle")
			.attr("font-size", vhToPx(1.5))
			.attr("fill", "var(--whiteCustom)")
			.text(mapVars[yVar]);

		svg.append("g").selectAll("circle")
			.data(res.points)
			.enter()
			.append("circle")
			.attr("cx", d => xScale(d.x))
			.attr("cy", d => yScale(d.y))
			.attr("r", 2.5)
			.attr("fill", "var(--azureCustom)")
			.attr("stroke", "#222")
			.attr("opacity", 0.6);

		// dichiarazione (in scope dove definisci il brush)
		let brushClearing = false;

		const brush = d3.brush()
			.extent([[padLeft, padTop], [W - padRight, H - padBottom]])
			.on("end", (event) => {
				// se stiamo eseguendo un brush.move() programmativo, ignoriamo l'evento per evitare ricorsione
				if (brushClearing) return;

				const sel = event.selection;
				const src = event.sourceEvent; // mouse event (undefined/null se chiamato programmaticamente)
				console.log("brush end", sel, src);

				// click senza drag: puliamo la grafica del brush in modo sicuro (non vogliamo ricorsione)
				if (!sel) {
					brushClearing = true;
					svg.select(".brush").call(brush.move, null);
					// sblocca al termine del ciclo di eventi
					setTimeout(() => { brushClearing = false; }, 0);
					return;
				}

				// selezione rettangolare valida
				const [[x0, y0], [x1, y1]] = sel;

				svg.selectAll("circle").each(function(d) {
					const cx = +d3.select(this).attr("cx");
					const cy = +d3.select(this).attr("cy");
					if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
						const idv = d.orig && (d.orig.id != null ? d.orig.id :
								(d.orig.__lap_id != null ? d.orig.__lap_id : d.orig[idKey]));
						if (idv != null) selectedIds.add(idv);
					}
				});

				d3.select("#pairView").selectAll("circle")
					.attr("r", d => selectedIds.has((d.orig['id'])) ? 3.5 : 2.5)
					.attr("stroke", d => selectedIds.has((d.orig['id'])) ? "#ff0" : "#222")
					.attr("opacity", d => selectedIds.has((d.orig['id'])) ? 0.95 : 0.6)
					.style("filter", d => selectedIds.has((d.orig['id'])) ? "brightness(1.2)" : null);

				if (colorBy == null || colorBy == 'none') {
					d3.select("#pairView").selectAll("circle").attr('fill', "var(--azureCustom)");
				} else if (colorBy === 'team') {
					d3.select("#pairView").selectAll("circle").attr('fill', d => teamColorMap[d.orig['Team']]);
				} else if (colorBy === 'track') {
					d3.select("#pairView").selectAll("circle").attr('fill', d => trackColorMap[d.orig['Track']]);
				} else if (colorBy === 'cluster') {
					d3.select("#pairView").selectAll("circle").attr('fill', d => clusterColorMap[idClusterMap[d.orig['id']]]);
				}

				// porta in primo piano i selezionati
				d3.select("#pairView").selectAll("circle")
					.filter(d => selectedIds.has((d.orig['id'])))
					.raise();

				// rimuovi la selezione visiva del brush senza ricorsione e aggiorna stile
				brushClearing = true;
				svg.select(".brush").call(brush.move, null);
				setTimeout(() => {
					brushClearing = false;
					opts.onSelectionChange();

				}, 0);
			});

		// aggiungi il layer brush (se non l'hai già fatto)
		svg.append("g").attr("class", "brush").call(brush);


		if (selectedIds.size !== 0) {
			svg.selectAll("circle")
				.attr("r", d => selectedIds.has((d.orig['id'])) ? 3.5 : 2.5)
				.attr("stroke", d => selectedIds.has((d.orig['id'])) ? "#ff0" : "#222")
				.attr("opacity", d => selectedIds.has((d.orig['id'])) ? 0.95 : 0.6)
				.style("filter", d => selectedIds.has((d.orig['id'])) ? "brightness(1.2)" : null);
		}

		if (colorBy == null || colorBy == 'none') {
			d3.select("#pairView").selectAll("circle").attr('fill', "var(--azureCustom)");
		} else if (colorBy === 'team') {
			d3.select("#pairView").selectAll("circle").attr('fill', d => teamColorMap[d.orig['Team']]);
		} else if (colorBy === 'track') {
			d3.select("#pairView").selectAll("circle").attr('fill', d => trackColorMap[d.orig['Track']]);
		} else if (colorBy === 'cluster') {
			d3.select("#pairView").selectAll("circle").attr('fill', d =>  {
				if (d.orig['id'] in idClusterMap && idClusterMap[d.orig['id']] in clusterColorMap) {
						return clusterColorMap[idClusterMap[d.orig['id']]];
					}
					return "var(--azureCustom)";
			});
		}


		// porta in primo piano i selezionati
		svg.selectAll("circle").filter(d => selectedIds.has((d.orig['id']))).raise();


	}).catch(err => {
		svg.selectAll("text").remove();
		svg.append("text").attr("x", W/2).attr("y", H/2).attr("text-anchor","middle").text("drawPairView worker error");
		console.error("drawPairView worker error", err);
	});

}

// inject the combined code into the page context by creating a new script element
const script = document.createElement('script');
script.type = 'module';
script.textContent = workerCodeSPLOM + '\n';
document.head.appendChild(script);
