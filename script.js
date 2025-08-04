// script.js

let currentScene = 0;

function setup() {
    d3.select("#next").on("click", () => {
        currentScene = (currentScene + 1) % 4; // cycle through 0-3
        drawScene(currentScene);
    });

    d3.select("#prev").on("click", () => {
        currentScene = (currentScene - 1 + 4) % 4;
        drawScene(currentScene);
    });

    drawScene(currentScene);
}

async function drawScene(scene) {
    d3.select("#viz").html(""); // Clear visualization
    d3.select("#description").html(""); // Clear description

    if (scene === 0) {
        // Scene 0: Total home runs per season since 1950
        d3.select("#description").text("Total home runs per season in Major League Baseball since 1950.");

        const data = await d3.csv("data/total_hr_per_season.csv", d => ({
            year: +d.year,
            HR: +d.home_runs
        }));

        const svg = d3.select("#viz").append("svg").attr("width", 700).attr("height", 400);
        const margin = { top: 40, right: 30, bottom: 50, left: 60 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.HR)]).nice()
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.HR))
            .curve(d3.curveMonotoneX);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(y));

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Annotation example
        g.append("text")
            .attr("x", x(1998))
            .attr("y", y(5500))
            .attr("fill", "red")
            .text("1998 HR Boom");

    } else if (scene === 1) {
        // Scene 1: Focus on HR boom (1995-2005)
        d3.select("#description").text("Focusing on the home run boom: 1995 to 2005.");

        const data = await d3.csv("data/total_hr_per_season.csv", d => ({
            year: +d.year,
            HR: +d.home_runs
        }));

        const filtered = data.filter(d => d.year >= 1995 && d.year <= 2005);

        const svg = d3.select("#viz").append("svg").attr("width", 700).attr("height", 400);
        const margin = { top: 40, right: 30, bottom: 50, left: 60 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(filtered, d => d.year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filtered, d => d.HR)]).nice()
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.HR))
            .curve(d3.curveMonotoneX);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(y));

        g.append("path")
            .datum(filtered)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 3)
            .attr("d", line);

        g.append("text")
            .attr("x", x(1998))
            .attr("y", y(5500))
            .attr("fill", "red")
            .text("Peak of HR Boom");

    } else if (scene === 2) {
        // Scene 2: Top HR hitter per season (bar chart)
        d3.select("#description").text("Top home run hitter per MLB season (Wikipedia data).");

        const data = await d3.csv("data/top_hr_leaders_wiki.csv", d => ({
            year: +d.yearID,
            player: d.player,
            HR: +d.HR
        }));

        const svg = d3.select("#viz").append("svg").attr("width", 900).attr("height", 500);
        const margin = { top: 40, right: 30, bottom: 100, left: 70 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // X scale and axis (years)
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, width])
            .padding(0.1);

        // Y scale and axis (HR)
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.HR)]).nice()
            .range([height, 0]);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-65)")
            .style("text-anchor", "end");

        g.append("g")
            .call(d3.axisLeft(y));

        // Bars
        g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.HR))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.HR))
            .attr("fill", "teal")
            .append("title")
            .text(d => `${d.player} (${d.year}): ${d.HR} HRs`);

    } else if (scene === 3) {
        // Scene 3: Correlation pitch velocity vs HR (scatter plot)
        d3.select("#description").text("Correlation between average pitch velocity and top home runs by year.");

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
            const hrMap = new Map(hrData.map(d => [d.year, d]));

            const merged = pitchData
                .filter(d => hrMap.has(d.year))
                .map(d => ({
                    year: d.year,
                    avgVelocity: d.avgVelocity,
                    player: hrMap.get(d.year).player,
                    HR: hrMap.get(d.year).HR
                }));

            const svg = d3.select("#viz").append("svg").attr("width", 700).attr("height", 400);
            const margin = { top: 30, right: 30, bottom: 50, left: 60 };
            const width = +svg.attr("width") - margin.left - margin.right;
            const height = +svg.attr("height") - margin.top - margin.bottom;
            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleLinear()
                .domain(d3.extent(merged, d => d.avgVelocity)).nice()
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain(d3.extent(merged, d => d.HR)).nice()
                .range([height, 0]);

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

            g.selectAll("circle")
                .data(merged)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.avgVelocity))
                .attr("cy", d => y(d.HR))
                .attr("r", 5)
                .attr("fill", "steelblue")
                .append("title")
                .text(d => `${d.year}: ${d.player} - ${d.HR} HRs, ${d.avgVelocity} mph`);

        }).catch(err => {
            console.error("Error loading or processing data: ", err);
            d3.select("#viz").append("p").text("Failed to load data.");
        });
    }
}

setup();
