let boxPlotInfoShown = false;

d3.select("#info-icon-boxplot").on("click", () => {
	if (boxPlotInfoShown) {
		d3.select("#info-container-boxplot").style("display", "none");
		d3.select("#container1 svg").style("display", "block");
		boxPlotInfoShown = false;
	} else {
		d3.select("#info-container-boxplot").style("display", "flex");
		d3.select("#container1 svg").style("display", "none");
		boxPlotInfoShown = true;
	}
});

function drawBoxPlotLinked(data, opts = {}) {
	const maxPointsPerDriver = opts.maxPointsPerDriver || 500
	const orderBy = opts.orderBy || "median";
	const valueKey = opts.valueKey || "LapTime_norm";
	const idKey = opts.idKey || "id";

	const width = vwToPx(45);
	const height = vhToPx(34);
	const margin = { top: vhToPx(1.5), right: vwToPx(2), bottom: vhToPx(5), left: vwToPx(2) };

	const clean = (d) => {
		const v = d[valueKey];
		const n = (v === null || v === undefined) ? NaN : +v;
		return Number.isFinite(n) ? n : NaN;
	};

	const grouped = d3.group(data, d => d["Driver"]);
	console.log("Grouped data for boxplot:", grouped);
	const drivers = Array.from(grouped, ([k, arr]) => {
		const vals = arr.map(d => clean(d)).filter(v => isFinite(v));
		return { driver: k, raw: arr, values: vals };
	}).filter(d => d.values.length > 0);

	console.log("Drivers with data for boxplot:", drivers.length);

	function sampleArray(arr, n) {
		if (n <= 0 || arr.length <= n) return arr.slice();
		const out = [];
		const step = arr.length / n;
		for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
		return out;
	}

	drivers.forEach(d => {
		if (maxPointsPerDriver > 0 && d.raw.length > maxPointsPerDriver) {
			d.sampledRaw = sampleArray(d.raw, maxPointsPerDriver);
			d.sampledValues = d.sampledRaw.map(r => clean(r)).filter(v => isFinite(v));
		} else {
			d.sampledRaw = d.raw.slice();
			d.sampledValues = d.values.slice();
		}
		d.sampledValues.sort((a,b) => a - b);
		d.q1 = d3.quantile(d.sampledValues, 0.25);
		d.median = d3.quantile(d.sampledValues, 0.5);
		d.q3 = d3.quantile(d.sampledValues, 0.75);
		d.iqr = d.q3 - d.q1;
		d.wLo = d3.max([d.sampledValues[0], d.q1 - 1.5 * d.iqr]);
		d.wHi = d3.min([d.sampledValues[d.sampledValues.length - 1], d.q3 + 1.5 * d.iqr]);
		d.outliers = d.sampledValues.filter(v => v < d.wLo || v > d.wHi);
	});

	if (orderBy === "median") {
		drivers.sort((a,b) => d3.ascending(a.median, b.median));
	} else {
		drivers.sort((a,b) => d3.ascending(a.driver, b.driver));
	}

	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	const x = d3.scaleBand()
		.domain(drivers.map(d => d.driver))
		.range([0, innerW])
		.paddingInner(0.3)
		.paddingOuter(0.15);

	const allValues = drivers.flatMap(d => d.sampledValues);
	const y = d3.scaleLinear()
		.domain(d3.extent(allValues)).nice()
		.range([innerH * 0.85, 0]); // lascia spazio per strip sotto

	const root = d3.select("#container1");
	root.selectAll("svg").remove();
	root.selectAll(".no-data").remove();

	if (drivers.length === 0) {
		root.append("div").attr("class", "no-data").text("No data for boxplot");
		return;
	}


	const svg = root
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	g.append("g")
		.attr("transform", `translate(0,${innerH * 0.9})`) // asse x più in basso
		.call(d3.axisBottom(x))
		.selectAll("text")
		.attr("transform", "rotate(-35)")
		.style("text-anchor", "end");

	// label asse X
	g.append("text")
		.attr("x", innerW / 2.2)
		.attr("y", height - margin.bottom / 1.5 )
		.attr("fill", "white")
		.text("Drivers")
		.style("font-size", `${vwToPx(0.8)}px`);

	g.append("g")
		.attr("class", "y-axis")
		.call(d3.axisLeft(y).ticks(6));

	g.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", - margin.left / 1.5)
		.attr("x", -innerH / 1.6)
		.attr("fill", "white")
		.text("LapTime*")
		.style("font-size", `${vwToPx(0.8)}px`);

	const boxW = Math.min(50, x.bandwidth());
	const boxG = g.selectAll(".box-g")
		.data(drivers)
		.enter()
		.append("g")
		.attr("class", "box-g")
		.attr("transform", d => `translate(${x(d.driver) + x.bandwidth() / 2},0)`)
		.style("cursor","pointer");


	boxG.append("rect")
		.attr("x", -x.bandwidth()/2)
		.attr("y", 0)
		.attr("width", x.bandwidth())
		.attr("height", innerH)
		.attr("fill","transparent")
		.attr("pointer-events","none");

	boxG.append("line")
		.attr("class","whisker lo")
		.attr("x1", 0).attr("x2", 0)
		.attr("y1", d => y(d.wLo))
		.attr("y2", d => y(d.q1))
		.attr("stroke","#aaa");

	boxG.append("line")
		.attr("class","whisker hi")
		.attr("x1", 0).attr("x2", 0)
		.attr("y1", d => y(d.q3))
		.attr("y2", d => y(d.wHi))
		.attr("stroke","#aaa");

	boxG.append("line").attr("class","cap lo")
		.attr("x1", -boxW/2).attr("x2", boxW/2)
		.attr("y1", d => y(d.wLo)).attr("y2", d => y(d.wLo))
		.attr("stroke","#aaa");

	boxG.append("line").attr("class","cap hi")
		.attr("x1", -boxW/2).attr("x2", boxW/2)
		.attr("y1", d => y(d.wHi)).attr("y2", d => y(d.wHi))
		.attr("stroke","#aaa");

	boxG.append("rect")
		.attr("class","box")
		.attr("x", -boxW/2)
		.attr("width", boxW)
		.attr("y", d => y(d.q3))
		.attr("height", d => Math.max(1, y(d.q1) - y(d.q3)))
		.attr("fill", "rgba(70,130,180,0.5)")
		.attr("stroke", "var(--azureCustom)")
		.attr("pointer-events","none");

	boxG.select("rect.box")
		.attr("pointer-events", "none")
		.style("opacity", 0.35);

	boxG.append("line")
		.attr("class","median")
		.attr("x1", -boxW/2).attr("x2", boxW/2)
		.attr("y1", d => y(d.median)).attr("y2", d => y(d.median))
		.attr("stroke", "var(--redF1Custom)")
		.attr("stroke-width", 2);


	boxG.selectAll(".outlier")
		.data(d => d.outliers.map(v => ({driver:d.driver, v})))
		.enter()
		.append("circle")
		.attr("class","outlier")
		.attr("cx", 0)
		.attr("cy", d => y(d.v))
		.attr("r", 2)
		.attr("fill", "red")
		.attr("opacity", 0.8);

	boxG.selectAll(".whisker, .cap, .median, .outlier")
    	.attr("pointer-events", "none");

	boxG.selectAll(".outlier").remove();

	boxG.selectAll(".median").raise();

	const pointsForDraw = drivers.flatMap(d => {
		return d.sampledRaw.map(r => {
			const val = clean(r);
			return { driver: d.driver, value: val, orig: r };
		}).filter(p => isFinite(p.value));
	});

	function jitterX(bandwidth, factor = 0.5) {
		return (Math.random() - 0.5) * (bandwidth * factor);
	}

	// create a group for points to make selection easier
	const pointsG = g.append("g").attr("class","points-layer");

	// key function uses idKey on original record if present, fallback to index
  	const keyFn = d => d.orig && d.orig[idKey] != null ? d.orig[idKey] : (d.orig && (d.orig.__lap_id || d.orig.id) ) || Math.random();

  	const pointSel = pointsG.selectAll("circle.point").data(pointsForDraw, keyFn);

	const circles = pointSel.enter().append("circle")
		.attr("class", "point")
		.attr("cx", d => x(d.driver) + x.bandwidth()/2 + jitterX(x.bandwidth()))
		.attr("cy", d => y(d.value))
		.attr("r", 2.8)
		.attr("fill", "var(--azureCustom)")
		.attr("opacity", 0.6)
		.attr("stroke", "#222")
		.style("cursor", "pointer")
		.on("mouseover", (event, d) => {
			const t = d3.select("body").selectAll(".boxplot-tooltip").data([1]).enter()
				.append("div")
				.attr("class","boxplot-tooltip")
				.style("position","absolute")
				.style("pointer-events","none")
				.style("background","rgba(0,0,0,0.7)")
				.style("color","#fff")
				.style("padding","6px 8px")
				.style("border-radius","4px")
				.style("font-size","12px")
				.merge(d3.select("body").selectAll(".boxplot-tooltip"));

			t.style("left", (event.pageX + 8) + "px")
			.style("top", (event.pageY + 8) + "px")
			.html(`<span>LapTime*: ${d.value.toFixed(2)}</span>
				<span>id: ${d.orig['id']}</span>
			`);
		})
		.on("mousemove", (event) => {
			d3.selectAll(".boxplot-tooltip")
				.style("left", (event.pageX + 8) + "px")
				.style("top", (event.pageY + 8) + "px");
		})
		.on("mouseout", () => {
			d3.selectAll(".boxplot-tooltip").remove();
		})
		// .on("click", (event, d) => {
		// 	selectedIds.add(d.orig[idKey]);
		// 	pointsG.selectAll("circle.point")
		// 		.attr("r", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? 4.5 : 2.8)
		// 		.attr("stroke", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? "#ff0" : "#222")
		// 		.attr("opacity", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? 0.9 : 0.25)
		// 		.style("filter", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? "brightness(1.2)" : null);

		// 	opts.onSelectionChange();
		// });

	console.log(colorBy);
	if (colorBy == null || colorBy == 'none') {
		circles.attr('fill', "var(--azureCustom)");
	} else if (colorBy === 'team') {
		circles.attr('fill', d => teamColorMap[d.orig['Team']]);
	} else if (colorBy === 'track') {
		circles.attr('fill', d => trackColorMap[d.orig['Track']]);
	} else if (colorBy === 'cluster') {
		circles.attr('fill', d => clusterColorMap[idClusterMap[d.orig['id']]]);
	}

}



function initBoxPlot(data, opts = {}) {
	const idKey = opts.idKey || "id";
	if (!data || data.length === 0) {
		d3.select("#container1").append("div").attr("class", "no-data").text("No data for boxplot");
		return;
	}
	drawBoxPlotLinked(data, opts);

	const api = {
		// setSelection() {
		// 	const pointsG = d3.select("#container1").select("svg").select("g").select("g.points-layer");
		// 	pointsG.selectAll("circle.point")
		// 		.attr("r", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? 4.5 : 3)
		// 		.attr("stroke", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? "#ff0" : "#222")
		// 		.attr("opacity", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? 0.95 : 0.5)
		// 		.style("filter", d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null) ? "brightness(1.2)" : null);

		// 	if (colorBy == null || colorBy == "none") {
		// 		pointsG.selectAll("circle.point").attr('fill', "var(--azureCustom)");
		// 	} else if (colorBy === 'team') {
		// 		pointsG.selectAll("circle.point").attr('fill', d => teamColorMap[d.orig['Team']]);
		// 	} else if (colorBy === 'track') {
		// 		pointsG.selectAll("circle.point").attr('fill', d => trackColorMap[d.orig['Track']]);
		// 	} else if (colorBy === 'cluster') {
		// 		pointsG.selectAll("circle.point").attr('fill', d => {
		// 			if (d.orig['id'] in idClusterMap && idClusterMap[d.orig['id']] in clusterColorMap) {
		// 				return clusterColorMap[idClusterMap[d.orig['id']]];
		// 			}
		// 			return "var(--azureCustom)";
		// 		});
		// 	}

		// 	pointsG.selectAll("circle.point").filter(d => selectedIds.has((d.orig && d.orig[idKey]) ? d.orig[idKey] : null)).raise();
		// },

		setSelection() {
			const filtered_data = data.filter(d => selectedIds.has(d[idKey]));
			if (filtered_data.length === 0) {
				console.log("No selection, redraw all: data.length =", data.length);
				drawBoxPlotLinked(data, opts);
			} else {
				drawBoxPlotLinked(filtered_data, opts);
			}
		},

		// setSelection3() {
		// 	const filtered_data = data.filter(d => selectedIds.has(d[idKey]));
		// 	if (filtered_data.length === 0) drawBoxPlotLinked(data, { });
		// 	else {
		// 		setSelection();
		// 	}
		// },

	};

	return api;
}
