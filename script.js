let scene = 0;
const svg = d3.select("#vis");
const width = +svg.attr("width") - 60;
const height = +svg.attr("height") - 60;
const margin = { top: 30, right: 30, bottom: 50, left: 50 };

let data;

(async function() {
  data = await d3.csv("data/league_home_runs.csv", d => ({
    year: +d.yearID,
    HR: +d.HR
  }));

  d3.select("#nextBtn").on("click", () => {
    if (scene < 2) scene++;
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

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  let sceneData = data;
  if (scene === 1) {
    sceneData = data.filter(d => d.year >= 1995 && d.year <= 2005);
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
    d3.select("#description").text("Total home runs per season in Major League Baseball since 1950.");
  } else if (scene === 1) {
    d3.select("#description").text("Focusing on the home run boom: 1995 to 2005.");
  }
}
