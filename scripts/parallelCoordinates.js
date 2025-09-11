
let parallelInfoShown = false;

d3.select("#info-icon-parallel").on("click", () => {
	if (parallelInfoShown) {
		d3.select("#info-container-parallel").style("display", "none");
		d3.select("#container2 svg").style("display", "block");
		parallelInfoShown = false;
	} else {
		d3.select("#info-container-parallel").style("display", "flex");
		d3.select("#container2 svg").style("display", "none");
		parallelInfoShown = true;
	}
});

function drawParallelCoordsLinked(data, opts = {}) {
	const idKey = opts.idKey || "id";
	const columns = ["LapNumber","Compound","TyreLife","Track","Rainfall","TrackTemp","LapTime_norm"];
	const width = vwToPx(45);
	const height = vhToPx(34.5);
	const margin = { top: vhToPx(1), right: vwToPx(1), bottom: vhToPx(4), left: vwToPx(5) };

	const defaultColTypes = {
		LapNumber: "numeric",
		Compound: "category",
		TyreLife: "numeric",
		Track: "category",
		Rainfall: "category",
		TrackTemp: "numeric",
		LapTime_norm: "numeric",
	};
	const colTypes = Object.assign({}, defaultColTypes);

	const clean = (d, k) => {
		const v = d[k];
		if (v === null || v === undefined) return NaN;
			const t = colTypes[k] === "numeric" ? +v : v;
		if (colTypes[k] === "numeric") return Number.isFinite(t) ? t : NaN;
			return t == null ? "" : String(t);
	};

	const root = d3.select("#container2");
	root.selectAll("svg").remove();

	const svg = root.append("svg").attr("width", width).attr("height", height);
	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;
	const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	const scales = {};
	const uniqueVals = {};
	columns.forEach(col => {
		if (colTypes[col] === "numeric") {
			const vals = data.map(d => clean(d, col)).filter(v => isFinite(v));
			const extent = d3.extent(vals);
			if (extent[0] == null) extent[0] = 0;
			if (extent[1] == null) extent[1] = 1;
			scales[col] = d3.scaleLinear().domain(extent).nice().range([innerH, 0]);
		} else {
			const vals = Array.from(new Set(data.map(d => clean(d, col)).filter(v => v !== null && v !== undefined && v !== "")));
			uniqueVals[col] = vals;
			scales[col] = d3.scalePoint().domain(vals).range([innerH, 0]).padding(0.5);
		}
	});

	const step = innerW / Math.max(1, columns.length - 1);
	const positions = {};
	columns.forEach((c, i) => positions[c] = i * step);

	const linesG = g.append("g").attr("class", "lines-layer");

	const axisG = g.append("g").attr("class", "axes");

	const axisGroups = axisG.selectAll(".axis-g").data(columns, d => d).enter()
		.append("g")
		.attr("class", "axis-g")
		.attr("transform", d => `translate(${positions[d]},0)`)
		.style("cursor", "move");

	axisGroups.append("rect")
		.attr("x", -vwToPx(1))
		.attr("y", 0)
		.attr("width", vwToPx(2))
		.attr("height", innerH)
		.attr("fill", "transparent")
		.attr("pointer-events", "all");

	axisGroups.append("text")
		.attr("class", "axis-label")
		.attr("y", innerH + vhToPx(2.2))
		.attr("text-anchor", "end")
		.style("font-size", "11px")
		.text(d => mapVars[d] || d);

	axisGroups.each(function(col) {
	const a = d3.select(this);

	if (col === "Team") {
		const axisFn = d3.axisLeft(scales[col]).tickFormat(() => "");
		a.append("g").attr("class", "axis").call(axisFn);

		a.selectAll(".tick")
			.append("image")
			.attr("xlink:href", d => teamLogos[d])
			.attr("x", -vwToPx(1.7))
			.attr("y", -vhToPx(1))
			.attr("width", vwToPx(1.15))
			.attr("height", vwToPx(1.15))
			.attr("preserveAspectRatio", "xMidYMid meet");
		// if going over image with mouse, show team name
		a.selectAll(".tick")
			.on("mouseover", function(event, d) {
				const t = d3.select("body").selectAll('.pc-tooltip').data([1]).enter()
					.append('div').attr('class','pc-tooltip')
					.style('position','absolute')
					.style('pointer-events','none')
					.style('background','rgba(0,0,0,0.75)')
					.style('color','#fff')
					.style('padding','4px 6px')
					.style('border-radius','4px')
					.style('font-size','11px')
					.merge(d3.selectAll('.pc-tooltip'));
				t.html(`<div>${d}</div>`)
					.style('left', (event.pageX - 32) + 'px')
					.style('top', (event.pageY + 8) + 'px');
			})
			.on("mousemove", function(event){
				d3.selectAll('.pc-tooltip')
					.style('left', (event.pageX - 32) + 'px')
					.style('top', (event.pageY + 8) + 'px');
			})
			.on("mouseout", function(){
				d3.selectAll('.pc-tooltip').remove();
			});

	} else if (col === "Compound") {
		const axisFn = d3.axisLeft(scales[col]).tickFormat(() => "");
		a.append("g").attr("class", "axis").call(axisFn);
		a.selectAll(".tick")
			.append("image")
			.attr("xlink:href", d => tyresImgs[d])
			.attr("x", -vwToPx(1.7))
			.attr("y", -vhToPx(1))
			.attr("width", vwToPx(1.15))
			.attr("height", vwToPx(1.15))
			.attr("preserveAspectRatio", "xMidYMid meet");
		// if going over image with mouse, show tyre name
		a.selectAll(".tick")
			.on("mouseover", function(event, d) {
				const t = d3.select("body").selectAll('.pc-tooltip').data([1]).enter()
					.append('div').attr('class','pc-tooltip')
					.style('position','absolute')
					.style('pointer-events','none')
					.style('background','rgba(0,0,0,0.75)')
					.style('color','#fff')
					.style('padding','4px 6px')
					.style('border-radius','4px')
					.style('font-size','11px')
					.merge(d3.selectAll('.pc-tooltip'));
				t.html(`<div>${tyresTextMap[d] || d}</div>`)
					.style('left', (event.pageX - 32) + 'px')
					.style('top', (event.pageY + 8) + 'px');
			})
			.on("mousemove", function(event){
				d3.selectAll('.pc-tooltip')
					.style('left', (event.pageX - 32) + 'px')
					.style('top', (event.pageY + 8) + 'px');
			})
			.on("mouseout", function(){
				d3.selectAll('.pc-tooltip').remove();
			});
	} else if (col === "Rainfall") {
		const axisFn = d3.axisLeft(scales[col]).tickFormat(() => "");
		a.append("g").attr("class", "axis").call(axisFn);
		a.selectAll(".tick")
			.append("image")
			.attr("xlink:href", d => weatherIcons[d])
			.attr("x", -vwToPx(1.7))
			.attr("y", -vhToPx(1))
			.attr("width", vwToPx(1.15))
			.attr("height", vwToPx(1.15))
			.attr("preserveAspectRatio", "xMidYMid meet");

	} else {
		const axisFn = colTypes[col] === "numeric"
		? d3.axisLeft(scales[col]).ticks(5)
		: d3.axisLeft(scales[col]);
		a.append("g").attr("class", "axis").call(axisFn);
	}
	});

	function xOf(col) {
		return positions[col];
	}

	const lineGen = d3.line().x(d => d[0]).y(d => d[1]);

	function segmentsForRow(d) {
		const segs = [];
		let cur = [];
		columns.forEach(col => {
			const val = clean(d, col);
			if (colTypes[col] === "numeric") {
				if (!Number.isFinite(val)) {
					if (cur.length) { segs.push(cur); cur = []; }
				} else {
					cur.push([xOf(col), scales[col](val)]);
				}
			} else {
				if (val == null || val === "") {
					if (cur.length) { segs.push(cur); cur = []; }
				} else {
					cur.push([xOf(col), scales[col](val)]);
				}
			}
		});
		if (cur.length) segs.push(cur);
		return segs;
	}

	function drawAllLines() {
		// in ogni riga metti anche i dati originali
		const rowG = linesG.selectAll("g.row").data(data, d => d[idKey]);

		const rowGEnter = rowG.enter().append("g").attr("class","row");

		rowGEnter.merge(rowG).each(function(d) {
			const gRow = d3.select(this);
			const segs = segmentsForRow(d);


			const segSel = gRow.selectAll("path.seg").data(segs);

			const segEnter = segSel.enter()
				.append("path")
				.attr("class","seg")
				.attr("fill", "none")
				.attr("stroke-width", 1)
				.attr("opacity", 0.7)
				.style("pointer-events","stroke");

			segEnter.merge(segSel)
				.attr("d", s => lineGen(s))
				.attr("stroke", () => {
					if (colorBy == null || colorBy === 'none') {
						return "steelblue";
					} else if (colorBy === 'team') {
						return teamColorMap[d['Team']] || 'steelblue';
					} else if (colorBy === 'track') {
						return trackColorMap[d['Track']] || 'steelblue';
					} else if (colorBy === 'cluster') {
						return clusterColorMap[idClusterMap[Number(d['id'])]] || 'steelblue';
					}
				});

			segSel.exit().remove();
		});

		rowG.exit().remove();

		linesG.selectAll("g.row")
		.on("mouseover", function(event, d){
			d3.select(this).selectAll("path.seg").attr("stroke-width", 2).attr("opacity", 1);
			showTooltip(event, d);
		})
		.on("mousemove", function(event){
			d3.selectAll('.pc-tooltip')
			.style('left', (event.pageX - 64) + 'px')
			.style('top', (event.pageY + 8) + 'px');
		})
		.on("mouseout", function(){
			updateHighlights();
			d3.selectAll('.pc-tooltip').remove();
		})
		.on("click", function(event, d){
			const key = d[idKey];
			if (key == null) return;
			if (selectedIds.has(key)) selectedIds.delete(key); else selectedIds.add(key);
			updateHighlights();
			opts.onSelectionChange(Array.from(selectedIds));
		});
	}

	function showTooltip(event, d) {
		const t = d3.select("body").selectAll('.pc-tooltip').data([1]).enter()
			.append('div').attr('class','pc-tooltip')
			.style('position','absolute')
			.style('pointer-events','none')
			.style('background','rgba(0,0,0,0.75)')
			.style('color','#fff')
			.style('padding','4px 6px')
			.style('border-radius','4px')
			.style('font-size','11px')
			.merge(d3.selectAll('.pc-tooltip'));

		const html = columns.map(c => {
			let value = d[c];
			if (c === "LapTime_norm") {
				value = parseFloat(value).toFixed(3);
			}
			return `<div><strong>${c}</strong>: ${value}</div>`;
		}).join('');

		t.html(html)
			.style('left', (event.pageX - 64) + 'px')
			.style('top', (event.pageY + 8) + 'px');
	}

	function updateHighlights() {
		const hasSel = selectedIds.size > 0;
		linesG.selectAll('g.row').each(function(d){
			const key = d[idKey];
			const isSelected = key != null && selectedIds.has(key);
			const segs = d3.select(this).selectAll('path.seg');
			segs.attr('stroke-width', isSelected ? 2 : 1)
				.attr('opacity', hasSel ? (isSelected ? 1 : 0.05) : 0.2)
				.attr('stroke', isSelected ? ('#ff0') : ('steelblue'));
			// const orig = data[key];
			// console.log(d);
			if (colorBy != null && colorBy !== 'none') {
				segs.attr('stroke', () => {
					if (colorBy === 'team') {
						return teamColorMap[d['Team']] || 'steelblue';
					} else if (colorBy === 'track') {
						return trackColorMap[d['Track']] || 'steelblue';
					} else if (colorBy === 'cluster') {
						return clusterColorMap[idClusterMap[Number(key)]] || 'steelblue';
					}
				});
			}
		});
		linesG.selectAll('g.row').filter(d => {
			const key = d[idKey];
			return key != null && selectedIds.has(key);
		}).each(function(){ d3.select(this).raise(); });
	}

	const drag = d3.drag()
		.on('start', function(event, col){
			d3.select(this).raise();
			d3.select(this).classed('dragging', true);
		})
		.on('drag', function(event, col){
			const x = Math.max(0, Math.min(innerW, event.x));
			positions[col] = x;
			d3.select(this).attr('transform', `translate(${x},0)`);
			redrawLinesPositions();
		})
		.on('end', function(event, col){
			d3.select(this).classed('dragging', false);
			const ordered = columns.slice().sort((a,b) => positions[a] - positions[b]);
			ordered.forEach((c, i) => positions[c] = i * (innerW / Math.max(1, ordered.length-1)));
			axisG.selectAll('.axis-g').data(ordered, d => d)
				.order()
				.transition().duration(200)
				.attr('transform', d => `translate(${positions[d]},0)`);
			axisG.selectAll('.axis-g').select('.axis-label')
				.attr('y', innerH + vhToPx(2.2));

			// ensure axis groups match new columns array
			// reorder columns array in place
			columns.length = 0; columns.push(...ordered);
			redrawLinesPositions();
		});

	axisGroups.call(drag);

	function redrawLinesPositions() {
		linesG.selectAll('g.row').data(data, d => d[idKey]).each(function(d){
			const segs = segmentsForRow(d);
			const segSel = d3.select(this).selectAll('path.seg').data(segs);
			segSel.enter().append('path').attr('class','seg')
				.attr('fill','none')
				.merge(segSel)
				.attr('d', s => lineGen(s));
			segSel.exit().remove();
		});
		updateHighlights();

	}

	drawAllLines();
	updateHighlights();

	// expose API
	const api = {
		setSelection(ids) {
			if (ids == null) { return; }
			updateHighlights();
		},
		redraw() { redrawLinesPositions(); },
		columns() { return columns.slice(); },
		setColumns(newCols) {
			// optional: replace columns and rebuild scales/axes
			// (not fully implemented)
			console.warn('setColumns not fully implemented');
		}
	};

  // return the API
  return api;
}

// NOTE: The helper functions vwToPx / vhToPx used in defaults should exist in the page scope.
// If you don't have them, replace width/height with absolute pixel values or implement these helpers.
