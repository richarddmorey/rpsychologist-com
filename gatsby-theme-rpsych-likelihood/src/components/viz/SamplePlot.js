import React, { useEffect, useRef } from "react";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { select  } from "d3-selection";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { normal } from "jstat";
import katex from "katex";
import { topTooltipPath } from "../utils"

// Generates data
const genData = (mu, sigma, x) => {
  var y = [];
  for (var i = 0; i < x.length; i++) {
    y.push(normal.pdf(x[i], mu, sigma));
  }
  var tmp = [];
  x.unshift(x[0]);
  y.unshift(0);
  x.push(x[x.length - 1]);
  y.push(0);
  for (let i = 0; i < x.length; i++) {
    tmp.push([x[i], y[i]]);
  }

  var data = {
    data: tmp,
    x: x,
    y: y
  };
  return data;
};
const aspect = 0.5;
const SampleChart = props => {
  const vizRef = useRef(null);

  // Stuff
  const margin = { top: 60, right: 20, bottom: 30, left: 55 };
 
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * aspect - margin.top - margin.bottom;
  const sample = props.sample;
  const sigma = Math.sqrt(props.sigma2)
  const sigmaTheta = Math.sqrt(props.sigma2Theta)
  // x.values
  const x_start = props.muTheta - 10 * sigmaTheta;
  const x_end = props.muTheta + 10 * sigmaTheta;

  const x_start2 = props.mu - 3 * sigma;
  const x_end2 = props.mu + 3 * sigma;
  const x = range( props.mu - 3 * sigma,
     props.mu + 3 * sigma, Math.abs(x_start2 - x_end2) / 50);
  x.push(x_end)
  x.unshift(x_start)
  

  // Data sets
  const data1 = genData(props.mu, sigma, x);

  // Axes min and max
  const x_max = props.muTheta + sigmaTheta * 5;
  const x_min = props.muTheta - sigmaTheta * 5;
  //const y_max = max(data1.y);
  const y_max = 0.04;
  // Create scales
  const yScale = scaleLinear()
    .domain([0, y_max])
    .range([h, 0]);

  const xScale = scaleLinear()
    .domain([x_min, x_max])
    .range([0, w]);

  // Scales and Axis
  const xAxis = axisBottom(xScale);
  const yAxis = axisLeft(yScale);

  // Update
  useEffect(() => {
    createSampleChart(durationTime);
  }, [props.mu, props.sigma2, props.highlight, props.sample, w]);

  // Tooltip
  const Tooltip = ({ d, i }) => {
    const x = xScale(d);
    const L = normal.pdf(d, props.mu, sigma);
    const y = yScale(L);
    const path = topTooltipPath(150, 50, 10, 10);
    const width = 150;
    const eqLogLik = katex.renderToString(`\\ell_{${i + 1}} = `, {
      displayMode: false,
      throwOnError: false
    });
    return (
      <g>
        <path
          d={path}
          className="polygonTip1"
          transform={`translate(${x + margin.left}, ${y + margin.top })`}
        />
        <foreignObject
          x={x - width / 2 + margin.left}
          y={y }
          width={width}
          height={50}
        >
          <div className="vizTooltip">
            <p>
              <span dangerouslySetInnerHTML={{ __html: eqLogLik }} />
              log({format(".2n")(L)})
            </p>
          </div>
        </foreignObject>
      </g>
    );
  };

  const createSampleChart = () => {
    const node = vizRef.current;

    // Line function
    const linex = line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    select(node)
      .selectAll("g.viz")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x Axis
    select(node)
      .selectAll("g.likelihood--xAxis")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "likelihood--xAxis");

    select(node)
      .select("g.likelihood--xAxis")
      .attr(
        "transform",
        "translate(" + margin.left + "," + (h + margin.top) + ")"
      )
      .call(xAxis);

    // y Axis
    select(node)
      .selectAll("g.likelihood--yAxis")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "likelihood--yAxis");

    select(node)
      .select("g.likelihood--yAxis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(yAxis);

    const gViz = select(node)
      .selectAll("g.viz")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "viz")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x label
    gViz
      .selectAll(".likelihood--x-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("class", "likelihood--x-label");

    select(node)
      .selectAll(".likelihood--x-label")
      .attr(
        "transform",
        "translate(" + w / 2 + " ," + (h + margin.bottom) + ")"
      )
      .text(props.xLabel);

    // y label
    gViz
      .selectAll(".likelihood--y-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("class", "likelihood--y-label");

    select(node)
      .selectAll(".likelihood--y-label")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("x", -(h / 2))
      .attr("y", -40)
      .text("Density");

    // Append dists

    // DIST1
    gViz
      .selectAll("#likelihoodDist")
      .data([data1.data])
      .enter()
      .append("svg:path")
      .attr("d", linex)
      .attr("id", "likelihoodDist");

    select(node)
      .selectAll("#likelihoodDist")
      .data([data1.data])
      .attr("d", linex);


    // mu vertical lines
    const sampleLines = (mu, id) => {
      gViz
        .selectAll("#" + id)
        .data([0])
        .enter()
        .append("line")
        .attr("class", "logLikLines")
        .attr("id", id);

      select(node)
        .selectAll("#" + id)
        .data([0])
        .attr("x1", xScale(mu))
        .attr("x2", xScale(mu))
        .attr("y1", yScale(normal.pdf(mu, props.mu, sigma)))
        .attr("y2", yScale(0));
    };

    //muLines(props.mu0, "mu0");
    sample.map((x, i) => sampleLines(x, `sample${i}`));
        // Points
        gViz
        .selectAll("circle")
        .data(sample)
        .enter()
        .append("svg:circle")
        .attr("cy", d => yScale(normal.pdf(d, props.mu, sigma)))
        .attr("cx", d => xScale(d));
  
      select(node)
        .selectAll("circle")
        .data(sample)
        .attr("cy", d => yScale(normal.pdf(d, props.mu, sigma)))
        .attr("cx", d => xScale(d))
        .attr("class", "likelihood--sampleCircles")
        .on("mouseover", function(d, i) {
          props.setHighlight(i);
          select(this).attr("r", 10)
        })
        .on("mouseout", function() {
          props.setHighlight();
          select(this).attr("r", 5)
        })
        .attr("r", (d, i) => {
          const r = props.highlight == i ? 10 : 5;
          return r;
        });
  
  };

  return (
    <svg width={props.width} height={props.width * aspect}>
      <g ref={vizRef} />
      {props.highlight >= 0 && (
        <Tooltip d={sample[props.highlight]} i={props.highlight} />
      )}
    </svg>
  );
};

export default SampleChart;
