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
    svg.selectAll("*").remove();

    if (scene === 0) {
        d3.select("#description").text("Total home runs per season in Major League Baseball since 1950.");
    } else if (scene === 1) {
        d3.select("#description").text("Focusing on the home run boom: 1995 to 2005.");
    } else if (scene === 2) {
        d3.select("#description").text("User exploration coming soon: top home run hitters by season.");
    } else if (scene === 3) {
        d3.select("#description").text("Comparing MLB home runs with average pitch velocity (1990–2024).");
    }

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

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

    } else if (scene === 3) {
        // Dual axis chart for home runs and pitch velocity

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

    } else if (scene === 2) {
        // Load both datasets asynchronously
        Promise.all([
            d3.csv("data/pitch_velocity.csv", d => ({
                year: +d.year,
                avgVelocity: +d.avgVelocity
            })),
            d3.csv("data/top_hr_leaders_wiki.csv", d => ({
                year: +d.yearID,
                player: d.player,
                HR: +d.HR
            }))
        ]).then(([pitchData, hrData]) => {
            // Join datasets on year
            const hrMap = new Map(hrData.map(d => [d.year, d]));

            // Merge pitch and HR data for years present in both
            const merged = pitchData
                .filter(d => hrMap.has(d.year))
                .map(d => ({
                    year: d.year,
                    avgVelocity: d.avgVelocity,
                    player: hrMap.get(d.year).player,
                    HR: hrMap.get(d.year).HR
                }));

            // Now build a scatter plot or line chart showing correlation:
            // x-axis: avgVelocity, y-axis: HR
            // Optionally add player labels on hover or annotation

            // Clear previous scene contents
            d3.select("#viz").html("");
            d3.select("#description").text("Correlation between average pitch velocity and home runs by top MLB hitter per year.");

            // Setup SVG, scales, axes (you can reuse your existing D3 setup)
            const svg = d3.select("#viz").append("svg")
                .attr("width", 700)
                .attr("height", 400);

            // Define margins, width, height
            const margin = { top: 30, right: 30, bottom: 50, left: 60 };
            const width = +svg.attr("width") - margin.left - margin.right;
            const height = +svg.attr("height") - margin.top - margin.bottom;

            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            // Scales
            const x = d3.scaleLinear()
                .domain(d3.extent(merged, d => d.avgVelocity)).nice()
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain(d3.extent(merged, d => d.HR)).nice()
                .range([height, 0]);

            // Axes
            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .text("Average Pitch Velocity (mph)");

            g.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -45)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text("Home Runs (Top Player)");

            // Points
            g.selectAll("circle")
                .data(merged)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.avgVelocity))
                .attr("cy", d => y(d.HR))
                .attr("r", 5)
                .attr("fill", "steelblue")
                .append("title")  // tooltip on hover
                .text(d => `${d.year}: ${d.player} - ${d.HR} HRs, ${d.avgVelocity} mph`);

            // Optional: Add a regression line or annotations for notable years

        }).catch(err => console.error(err));
    }
}
