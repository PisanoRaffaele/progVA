function renderCellHeatmap(xVar, yVar, cellIndex, bins = 20, context = SPLOMContext) {
    const { gMain } = context;
    const cellG = gMain.selectAll(".cell").filter((d,i)=>i===cellIndex);
    if(cellG.empty()) return;

    cellG.selectAll(".loading").remove();
    cellG.append("text").attr("class","loading").attr("x",6).attr("y",12).text("loading...");

    requestHeatmapFromWorker(xVar, yVar, bins).then(res => {
        cellG.selectAll(".loading").remove();
        renderHeatmap(cellG, res.data, res.xExtent, res.yExtent, res.bins, context);
    }).catch(err => {
        cellG.selectAll(".loading").remove();
        console.error("renderCellHeatmap error:", err);
    });
}

function renderAllCellHeatmaps(context = SPLOMContext, bins = 20){
    const { gMain } = context;
    gMain.selectAll(".cell").each((d,i)=>{
        renderCellHeatmap(d[0], d[1], i, bins, context);
    });
}

function renderHeatmap(cellG, heatData, xExtent, yExtent, bins, context){
    const { size, padding } = context;
    const xScale = d3.scaleLinear().domain(xExtent).range([padding/2, size-padding/2]);
    const yScale = d3.scaleLinear().domain(yExtent).range([size-padding/2, padding/2]);

	const maxCount = currentSubFiltered.length;

	const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, maxCount]);
    const rectSize = size / bins;

    const cells = cellG.selectAll("rect.heat").data(heatData);

	cellG.selectAll("rect.bg").data([1]).join("rect")
        .attr("class","bg")
        .attr("x",0)
        .attr("y",0)
        .attr("width", size)
        .attr("height", size)
        .attr("fill", "var(--vat(lightBlackCustom))");

    cells.join("rect")
        .attr("class", "heat")
        .attr("x", d=>xScale(xExtent[0] + (xExtent[1]-xExtent[0])*(d.i)/bins))
        .attr("y", d=>yScale(yExtent[0] + (yExtent[1]-yExtent[0])*(d.j)/bins))
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("fill", d => colorScale(d.count))
		.attr("stroke", "none");
}

function drawHeatmapLegend(colorScale, bins = 5) {
    const legendDiv = d3.select("#heatmap-legend");
    legendDiv.selectAll("*").remove();

    const domain = colorScale.domain();
    const minVal = domain[0];
    const maxVal = domain[1];

    const legendData = d3.range(bins).map(i => {
        const min = minVal + (i / bins) * (maxVal - minVal);
        const max = minVal + ((i + 1) / bins) * (maxVal - minVal);
        return { min, max };
    });

	const legendWidth = 400;
    const legendHeight = 50;
    const rectWidth = (legendWidth - 40) / bins;

	const legendScale = d3.scaleLinear()
		.domain([minVal, maxVal])
		.range([0, legendWidth-40]);

	const legendAxis = d3.axisBottom(legendScale).tickValues([0, maxVal / 4, maxVal / 2, (3 * maxVal) / 4, maxVal]);

    const svg = legendDiv.append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    svg.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", (d,i) => i * rectWidth + 10)
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", legendHeight / 2)
        .attr("fill", d => colorScale(d.min));

     svg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(10, ${legendHeight / 2})`)
        .call(legendAxis)
        .selectAll("text")
        .attr("fill", "white")
        .attr("font-size", 10);
}
