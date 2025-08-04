let scene = 0;
const svg = d3.select("#vis");
const width = +svg.attr("width") - 60;
const height = +svg.attr("height") - 60;
const margin = { top: 30, right: 60, bottom: 50, left: 50 }; // wider right margin for right y-axis

let homeRunData;
let pitchVelocityData;

(async function () {
    homeRunData = await d3.csv("data/league_home_runs.csv", d => ({
        year: +d.yearID,
        HR: +d.HR
    }));

    pitchVelocityData = await d3.csv("data/pitch_velocity.csv", d => ({
        year: +d.yearID,
        pitchVelocity: +d.pitchVelocity
    }));

    d3.select("#nextBtn").on("click", () => {
        if (scene < 3) scene++;
        drawScene();
    });

    d3.select("#prevBtn").on("click", () => {
        if (scene > 0) scene--;
        drawScene();
    });

    drawScene();
})();

function drawScene() {
    // Clear previous contents
    svg.selectAll("*").remove();
    d3.select("#viz").html("");

    // Show/hide containers depending on scene
    if (scene === 3) {
        d3.select("#vis").style("display", "none");
        d3.select("#viz").style("display", "block");
        d3.select("#search-container").style("display", "block");
    } else {
        d3.select("#vis").style("display", "block");
        d3.select("#viz").style("display", "none");
        d3.select("#search-container").style("display", "none");
        d3.select("#yearSearch").property("value", "");
    }

    if (scene === 0) {
        d3.select("#description").text("Total home runs per season in Major League Baseball since 1950.");
    } else if (scene === 1) {
        d3.select("#description").text("Focusing on the home run boom: 1995 to 2005.");
    } else if (scene === 2) {
        d3.select("#description").text("Comparing MLB home runs with average pitch velocity (1990–2024).");
    } else if (scene === 3) {
        d3.select("#description").text("Explore top home run leaders by year.");
    }

    if (scene === 0 || scene === 1) {
        let sceneData = homeRunData;
        if (scene === 1) {
            sceneData = homeRunData.filter(d => d.year >= 1995 && d.year <= 2005);
        }

        const x = d3.scaleLinear()
            .domain(d3.extent(sceneData, d => d.year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(sceneData, d => d.HR)]).nice()
            .range([height, 0]);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(y));

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.HR));

        g.append("path")
            .datum(sceneData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        if (scene === 0) {
            const annotations = [
                {
                    note: {
                        label: "Home run surge begins in the mid-90s",
                        title: "Rising Power"
                    },
                    x: x(1998),
                    y: y(5500),
                    dy: -50,
                    dx: 40
                }
            ];
            const makeAnnotations = d3.annotation().annotations(annotations);
            g.append("g").call(makeAnnotations);
        }

    } else if (scene === 2) {
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const years = pitchVelocityData.map(d => d.year);
        const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, width]);

        const yLeft = d3.scaleLinear()
            .domain([0, d3.max(homeRunData.filter(d => d.year >= 1990).map(d => d.HR))]).nice()
            .range([height, 0]);

        const yRight = d3.scaleLinear()
            .domain([
                d3.min(pitchVelocityData, d => d.pitchVelocity) - 1,
                d3.max(pitchVelocityData, d => d.pitchVelocity) + 1
            ])
            .range([height, 0]);

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(yLeft))
            .append("text")
            .attr("fill", "steelblue")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("dy", "1em")
            .attr("text-anchor", "end")
            .text("Home Runs");

        g.append("g")
            .attr("transform", `translate(${width},0)`)
            .call(d3.axisRight(yRight))
            .append("text")
            .attr("fill", "orange")
            .attr("transform", "rotate(-90)")
            .attr("y", 40)
            .attr("dy", "-1em")
            .attr("text-anchor", "end")
            .text("Avg Pitch Velocity (mph)");

        // Lines
        const lineHR = d3.line()
            .x(d => x(d.year))
            .y(d => yLeft(d.HR));

        const linePV = d3.line()
            .x(d => x(d.year))
            .y(d => yRight(d.pitchVelocity));

        g.append("path")
            .datum(homeRunData.filter(d => d.year >= 1990))
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", lineHR);

        g.append("path")
            .datum(pitchVelocityData)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("d", linePV);

        // Annotation
        const annotations = [
            {
                note: {
                    label: "Pitch velocity increase may have contributed to more home runs",
                    title: "Velocity & Power"
                },
                x: x(2015),
                y: yLeft(6500),
                dy: -30,
                dx: 30
            }
        ];

        const makeAnnotations = d3.annotation().annotations(annotations);
        g.append("g").call(makeAnnotations);

    } else if (scene === 3) {
        d3.select("#description").text("Explore top home run leaders by year.");

        d3.csv("data/top_hr_leaders_wiki.csv", d => ({
            year: +d.yearID,
            player: d.player,
            HR: +d.HR
        })).then(data => {
            data.sort((a, b) => a.year - b.year);

            const container = d3.select("#viz")
                .style("max-height", "400px")
                .style("overflow-y", "auto")
                .style("border", "1px solid #ccc")
                .style("padding", "10px")
                .style("font-family", "sans-serif");

            const list = container.append("ul")
                .style("list-style", "none")
                .style("padding", 0)
                .style("margin", 0);

            // Function to render filtered list
            function renderList(filterYear) {
                list.selectAll("li").remove();

                let filteredData = data;
                if (filterYear) {
                    filteredData = data.filter(d => d.year === filterYear);
                }

                list.selectAll("li")
                    .data(filteredData)
                    .enter()
                    .append("li")
                    .style("padding", "5px 0")
                    .style("border-bottom", "1px solid #eee")
                    .html(d => `<strong>${d.year}</strong>: ${d.player} — ${d.HR} HRs`);

                if (filteredData.length === 0) {
                    list.append("li")
                        .style("padding", "5px 0")
                        .text("No results for that year.");
                }
            }

            renderList();

            // Attach event listener to search input
            d3.select("#yearSearch").on("input", function () {
                const yearInput = +this.value;
                if (yearInput && !isNaN(yearInput)) {
                    renderList(yearInput);
                } else {
                    renderList();
                }
            });

        }).catch(err => {
            console.error(err);
            d3.select("#viz").html("Failed to load data.");
        });
    }
}
