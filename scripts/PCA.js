let clusterColorMap = {};
let idClusterMap = {};
let colorBy = "none";

function clearObject(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete obj[key];
    }
  }
}


d3.select("#info-icon-pca").on("click", () => {
	if (infoShown) {
		d3.select("#info-container-pca").style("display", "none");
		d3.select("#container5 svg").style("display", "block");
		d3.select('#PCAkmeansDiv').style("visibility", "visible");
		d3.select('#PCAselectDiv').style("visibility", "visible");
		infoShown = false;
	} else {
		d3.select("#info-container-pca").style("display", "block");
		d3.select("#container5 svg").style("display", "none");
		d3.select('#PCAkmeansDiv').style("visibility", "hidden");
		d3.select('#PCAselectDiv').style("visibility", "hidden");
		infoShown = true;
	}
});

async function postPCA(jsData) {
  const payload = {
    data: jsData,
    features: ["LapNumber","TyreLife","Rainfall","TrackTemp","LapTime_norm","Compound"],
    one_hot_compound: true,
    scale: true
  };
  const res = await fetch('http://localhost:5000/pca', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  return json;
}

async function postKmeans(projected, k) {
  const res = await fetch('http://localhost:5000/kmeans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projected, k, persist: true })
  });
  return res.json();
}

function drawScatter(projected) {
	const width = vwToPx(18);
	const height = vwToPx(18);
	const margin = { top: vwToPx(1), right: vwToPx(0.5), bottom: vwToPx(3), left: vwToPx(2.6) };
	const svg = d3.select("#container5").select("svg");
	svg.selectAll("*").remove();

	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	const x = d3.scaleLinear()
		.domain(d3.extent(projected, d => d.x)).nice()
		.range([0, innerW]);

	const y = d3.scaleLinear()
		.domain(d3.extent(projected, d => d.y)).nice()
		.range([innerH, 0]);

	// assi
	const xAxis = d3.axisBottom(x)
		.ticks(Math.floor(innerW / 25))   // meno ticks (ogni ~1.0 unità)
		.tickFormat(d3.format(".1f"));   // formato decimale breve

	const yAxis = d3.axisLeft(y)
		.ticks(Math.floor(innerH / 25))
		.tickFormat(d3.format(".1f"));

	g.append("g")
		.attr("transform", `translate(0,${innerH})`)
		.call(xAxis)
		.append("text")
		.attr("x", innerW / 2)
		.attr("y", margin.bottom / 2 + 8)
		.attr("font-weight", "bold")
		.attr("text-anchor", "middle")
		.style("font-size", "12px")
		.attr("fill", "white")
		.text("PC1");

	g.append("g")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -innerH / 2 - 6)
		.attr("y", -vwToPx(1.8))
		.attr("font-weight", "bold")
		.attr("text-anchor", "middle")
		.style("font-size", "12px")
		.attr("fill", "white")
		.text("PC2");

	g.selectAll("circle")
		.data(projected)
		.enter()
		.append("circle")
		.attr("cx", d => x(d.x))
		.attr("cy", d => y(d.y))
		.attr("r", 2.8)
		.attr("opacity", 0.65)
		.attr("stroke", "#222")
		.attr("fill", "var(--azureCustom)")
		.attr("opacity", 0.8)
		.append("title")
		.text(d => `id: ${d.id}`);

	function refreshSelection() {
		g.selectAll("circle")
			.style("opacity", d => selectedIds.has(Number(d.id)) ? 0.95 : 0.4)
			.attr("r", d => selectedIds.has(Number(d.id)) ? 4.5 : 2.8)
			.style("stroke", d => selectedIds.has(Number(d.id)) ? "#ff0" : "#222");
		// porta in primo piano i selezionati
		g.selectAll("circle").filter(d => selectedIds.has(Number(d.id))).raise();
	}

	const brush = d3.brush()
		.extent([[0, 0], [innerW, innerH]])
		.on("end", (event) => {
			if (!event.selection) return;
			const [[x0, y0], [x1, y1]] = event.selection;
			g.selectAll("circle").each((d) => {
			const cx = x(d.x), cy = y(d.y);
			if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
				selectedIds.add(Number(d.id));
			}
			});
			// pulisci brush e refresh
			g.select(".brush").call(brush.move, null);
			// if opts.onSelectionChange esiste, chiamala
			if (localPcaOpts.onSelectionChange) localPcaOpts.onSelectionChange();
			refreshSelection();
		});

	g.append("g").attr("class", "brush").call(brush);

	// click sui punti: shift/ctrl/meta = toggle multiplo, altrimenti select singolo
	g.selectAll("circle")
		.on("click", function(event, d) {
			const id = Number(d.id);
			if (event.shiftKey || event.ctrlKey || event.metaKey) {
			if (selectedIds.has(id)) selectedIds.delete(id);
			else selectedIds.add(id);
			} else {
				selectedIds.clear();
				selectedIds.add(id);
			}
			if (localPcaOpts.onSelectionChange) localPcaOpts.onSelectionChange();
			refreshSelection();
			event.stopPropagation();
		});

	// click sullo sfondo (svg) per deselezionare (se non si usa modifier)
	// svg.on("click", (event) => {
	// if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
	// 	selectedIds.clear();
	// 	console.log("Selected IDs cleared");
	// 	if (opts && opts.onSelectionChange) opts.onSelectionChange();
	// 	refreshSelection();
	// }
	// });
}

function colorPoints() {
	d3.selectAll("#container5 svg g circle")
		.attr("fill", d => {
			if (colorBy == 'cluster') {
				if (idClusterMap && clusterColorMap) {
					const cluster = idClusterMap[d.id];
					return cluster != null ? clusterColorMap[cluster] : "var(--azureCustom)";
				} return "var(--azureCustom)";
			} else if (colorBy == 'team') {
				const team = d.orig['Team'];
				if (team in teamColorMap)
					return teamColorMap[team];
				return "var(--azureCustom)";
			} else if (colorBy == 'track') {
				const track = d.orig['Track'];
				if (track in trackColorMap)
					return trackColorMap[track];
				return "var(--azureCustom)";
			}
			return "var(--azureCustom)";
		});
}

function initPca(){
	d3.select("#container5").select("#PCAkmeansDiv").select("#kmeansButton")
		.on("click", async () => {

			clearObject(clusterColorMap);
			clearObject(idClusterMap);

			const kInput = d3.select("#container5").select("#PCAkmeansDiv").select("input");
			const k = +kInput.node().value || 3;
			const kmRes = await postKmeans(projected, k);
			clusterColorMap = kmRes.cluster_color_map;
			idClusterMap = kmRes.ids_cluster_map;
			drawScatter(projected);

			d3.select("#container5").select("#PCAselectDiv").select(".sil")
				.text(`Silhouette: ${kmRes.silhouette ? kmRes.silhouette.toFixed(3) : '#####'}`);

			const pcaSelectDiv = d3.select("#container5").select("#PCAselectDiv")
			let currentVal = pcaSelectDiv.select('#colorSelect').node().value;
			if (currentVal === "cluster") {
				colorBy = "cluster";
				colorPoints();
				pcaSelectDiv.select('select').node().value = "cluster";
				if (localPcaOpts) localPcaOpts.onColorChange && localPcaOpts.onColorChange("cluster");
			} else {
				colorBy = 'cluster';
				colorPoints();
				pcaSelectDiv.select('select').node().value = "cluster";
				if (localPcaOpts) localPcaOpts.onColorChange && localPcaOpts.onColorChange("cluster");
			}
		});
	d3.select("#container5").select('#PCAselectDiv').select('select')
		.on("change", (event) => {
			const value = d3.select(event.target).node().value;
			colorBy = value;
			console.log("Color by:", colorBy);
			colorPoints();
			if (localPcaOpts) localPcaOpts.onColorChange && localPcaOpts.onColorChange();
		})
}

let projected = null;
let localPcaOpts = null;
initPca();

function clickOnKMeans() {
	d3.select("#container5").select("#PCAkmeansDiv").select("#kmeansButton").dispatch("click");
}

function initPCAScatter(jsData, opts = {}) {
	features = ["LapNumber","TyreLife","Rainfall","TrackTemp","LapTime_norm","Compound"];
	localPcaOpts = opts;
	( async () => {
		const pcaResp = await postPCA(jsData);
		projected = pcaResp.projected;
		drawScatter(projected);
		clickOnKMeans();

	})();

	function updateSelection(ids) {
		const circles = d3.selectAll("#container5 svg g circle")
			.style("opacity", d => ids.includes(Number(d.id)) ? 0.95 : 0.4)
			.attr("r", d => ids.includes(Number(d.id)) ? 4.5 : 2.8)
			.style("stroke", d => ids.includes(Number(d.id)) ? "#ff0" : "#222");

		// portali in primo piano
		circles.filter(d => ids.includes(Number(d.id))).raise();
	}

	return {
		updateSelection: updateSelection,
	};
}
