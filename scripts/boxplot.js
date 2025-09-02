// drawBoxPlot: data = array, opts = { width, height, margin, maxPointsPerDriver, orderBy }
function drawBoxPlot(data, opts = {}) {
	const {
		maxPointsPerDriver = 500,
		orderBy = "median"
	} = opts;

	const width = 850;
	const height = 360;
	const margin = { top: 20, right: 20, bottom: 80, left: 60 };

	const root = d3.select("#container1");
	root.selectAll("*").remove();

	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	const clean = (d) => {
		const v = d['LapTime_norm'];
		const n = (v === null || v === undefined) ? NaN : +v;
		return Number.isFinite(n) ? n : NaN;
	};

	const grouped = d3.group(data, d => d['Driver']);
	const drivers = Array.from(grouped, ([k, arr]) => {
		const vals = arr.map(d => clean(d)).filter(v => isFinite(v));
		return { driver: k, raw: arr, values: vals };
	}).filter(d => d.values.length > 0);

	if (drivers.length === 0) {
		root.append("div").text("No data for boxplot");
		return;
	}

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

	const x = d3.scaleBand()
		.domain(drivers.map(d => d.driver))
		.range([0, innerW])
		.paddingInner(0.3)
		.paddingOuter(0.15);

	const allValues = drivers.flatMap(d => d.sampledValues);
	const y = d3.scaleLinear()
		.domain(d3.extent(allValues)).nice()
		.range([innerH * 0.85, 0]); // lascia spazio per strip sotto

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

	g.append("g")
		.attr("class", "y-axis")
		.call(d3.axisLeft(y).ticks(6));

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
		.attr("fill","transparent");

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
		.attr("stroke", "var(--azureCustom)");

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

	const pointsForDraw = drivers.flatMap(d => {
		return d.sampledRaw.map(r => {
			const val = clean(r);
			return { driver: d.driver, value: val, orig: r };
		}).filter(p => isFinite(p.value));
	});

	function jitterX(bandwidth, factor = 0.7) {
		return (Math.random() - 0.5) * (bandwidth * factor);
	}

	const pointsSel = g.selectAll(".point")
    	.data(pointsForDraw, (d,i) => (d.orig && d.orig.__id) || i);

	pointsSel.enter()
		.append("circle")
		.attr("class", "point")
		.attr("cx", d => x(d.driver) + x.bandwidth()/2 + jitterX(x.bandwidth()))
		.attr("cy", d => y(d.value))
		.attr("r", 2.8)
		.attr("fill", "var(--azureCustom)")
		.attr("opacity", 0.65)
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
			.html(`<strong>${d.driver}</strong><div>${valueKey}: ${d.value}</div>`);
		})
		.on("mousemove", (event) => {
		d3.selectAll(".boxplot-tooltip")
			.style("left", (event.pageX + 8) + "px")
			.style("top", (event.pageY + 8) + "px");
		})
		.on("mouseout", () => {
		d3.selectAll(".boxplot-tooltip").remove();
		})
		.on("click", (event, d) => {
		// azione click sui singoli punti
		console.log("Point clicked:", d);
		// esempio: mostra dettagli o filtra la vista
		});

	// update (se hai dinamica)
	pointsSel
		.attr("cx", d => x(d.driver) + x.bandwidth()/2 + jitterX(x.bandwidth()))
		.attr("cy", d => y(d.value));
	
	// pointsSel.exit().remove();


	return { svg, x, y, drivers };
}
