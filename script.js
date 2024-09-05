document.addEventListener('DOMContentLoaded', function() {
    const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
    fetch(url)
        .then(response => response.json())
        .then(data => createHeatMap(data));
});

function createHeatMap(data) {
    const baseTemperature = data.baseTemperature;
    const dataset = data.monthlyVariance;

    // Extracting the unique years and the range of years for scales
    const years = dataset.map(d => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    const margin = { top: 50, right: 20, bottom: 100, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define scales
    const xScale = d3.scaleBand()
        .domain(d3.range(minYear, maxYear + 1)) // Range of years
        .range([0, width])
        .padding(0);

    const yScale = d3.scaleBand()
        .domain(d3.range(0, 12)) // 0 to 11 for months
        .range([0, height])
        .padding(0);

    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdYlBu)
        .domain([d3.max(dataset, d => baseTemperature + d.variance), d3.min(dataset, d => baseTemperature + d.variance)]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter(year => year % 10 === 0))
        .tickFormat(d3.format('d'));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(month => d3.timeFormat('%B')(new Date(0, month)));

    svg.append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);

    svg.append('g')
        .attr('id', 'y-axis')
        .call(yAxis);

    // Create cells
    svg.selectAll('.cell')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('data-month', d => d.month - 1) // Ensure month is 0-11 range
        .attr('data-year', d => d.year)      // Ensure year is within the dataset range
        .attr('data-temp', d => baseTemperature + d.variance)
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.month - 1))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(baseTemperature + d.variance))
        .on('mouseover', function(event, d) {
            const tooltip = d3.select('#tooltip');
            tooltip.style('opacity', 1);
            tooltip.html(`Year: ${d.year}<br>Month: ${d3.timeFormat('%B')(new Date(0, d.month - 1))}<br>Temp: ${(baseTemperature + d.variance).toFixed(2)}℃`)
                .attr('data-year', d.year)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select('#tooltip').style('opacity', 0);
        });

    // Create legend
    const legendWidth = 400;
    const legendHeight = 20;

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(10)
        .tickFormat(d3.format('.1f'));

    const legend = svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${(width - legendWidth) / 2}, ${height + 40})`);

    legend.selectAll('rect')
        .data(colorScale.ticks(10).map(t => [t, t + 0.1]))
        .enter()
        .append('rect')
        .attr('x', d => legendScale(d[0]))
        .attr('y', 0)
        .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
        .attr('height', legendHeight)
        .attr('fill', d => colorScale(d[0]));

    legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(legendAxis);
}
