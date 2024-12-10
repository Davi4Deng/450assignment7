import React, { Component } from "react";
import * as d3 from "d3";

class App extends Component {
  constructor() {
    super();
    this.state = {
      data: [], // 推文数据
      selectedTweets: [], // 被选中的推文
      colorBy: "Sentiment", // 默认按情感着色
    };
    this.svgRef = React.createRef();
    this.legendRef = React.createRef(); // 图例容器
  }

  handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      this.setState({ data }, this.renderChart);
    };

    if (file) reader.readAsText(file);
  };

  handleColorChange = (e) => {
    this.setState({ colorBy: e.target.value }, this.renderChart);
  };

  handleTweetClick = (tweet) => {
    this.setState((prevState) => {
      const isSelected = prevState.selectedTweets.find((t) => t.idx === tweet.idx);
      const selectedTweets = isSelected
        ? prevState.selectedTweets.filter((t) => t.idx !== tweet.idx)
        : [tweet, ...prevState.selectedTweets];

      return { selectedTweets };
    }, this.renderChart);
  };

  renderChart = () => {
    const { data, colorBy, selectedTweets } = this.state;
  
    const width = 600; // 图表宽度
    const height = 400; // 图表高度
    const marginLeft = 100; // 左侧边距，用于放置月份标签
    const svg = d3
      .select(this.svgRef.current)
      .attr("width", width + marginLeft) // 增加左侧边距
      .attr("height", height);
  
    // 清空之前的图形
    svg.selectAll("*").remove();
  
    // 颜色比例尺
    const sentimentColorScale = d3.scaleLinear().domain([-1, 0, 1]).range(["red", "#ECECEC", "green"]);
    const subjectivityColorScale = d3.scaleLinear().domain([0, 1]).range(["#ECECEC", "#4467C4"]);
    const colorScale = colorBy === "Sentiment" ? sentimentColorScale : subjectivityColorScale;
  
    // 力导向布局
    const simulation = d3
      .forceSimulation(data)
      .force("x", d3.forceX((d) => this.getMonthPosition(d.Month, width, marginLeft)).strength(0.3))
      .force("y", d3.forceY((d) => this.getRowPosition(d.Month, height)).strength(0.3))
      .force("collide", d3.forceCollide(8)) // 碰撞范围调整为较小值
      .stop();
  
    // 模拟布局
    for (let i = 0; i < 300; ++i) simulation.tick();
  
    // 绘制圆圈
    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 5)
      .attr("fill", (d) => colorScale(d[colorBy]))
      .attr("stroke", (d) => (selectedTweets.find((t) => t.idx === d.idx) ? "black" : "none"))
      .style("transform", "none") // 清除 transform 样式
      .style("animation", "none") // 清除动画样式
      .style("transition", "none") // 清除任何可能的 transition 效果
      .on("click", (event, d) => this.handleTweetClick(d));

  
    // 添加左侧月份标签
    const months = ["March", "April", "May"];
    const yPositions = [height / 4, height / 2, (3 * height) / 4]; // 垂直位置分布
    months.forEach((month, i) => {
      svg
        .append("text")
        .attr("x", 50) // 左侧偏移位置
        .attr("y", yPositions[i]) // 垂直位置
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("alignment-baseline", "middle") // 垂直对齐到文本中心
        .text(month);
    });
  
    // 渲染颜色图例
    this.renderLegend(colorScale, colorBy);
  };
  
  // 调整月份的水平位置，增加左侧边距
  getMonthPosition = (month, width, marginLeft) => {
    const positions = { March: marginLeft + width / 4, April: marginLeft + width / 2, May: marginLeft + (3 * width) / 4 };
    return positions[month] || marginLeft + width / 2;
  };
  
  // 调整月份的垂直位置
  getRowPosition = (month, height) => {
    const rowPositions = { March: height / 4, April: height / 2, May: (3 * height) / 4 };
    return rowPositions[month] || height / 2;
  };
  

  renderLegend = (colorScale, colorBy) => {
    const legend = d3.select(this.legendRef.current);
    legend.selectAll("*").remove();
  
    const legendHeight = 130; // 图例高度
    const legendWidth = 15; // 图例宽度
    const legendPadding = 60; // 为文本留出额外空间
    const verticalPadding = 10; // 图例上下的额外留白
  
    const gradient = legend
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");
  
    const range = colorBy === "Sentiment" ? ["red", "#ECECEC", "green"] : ["#ECECEC", "#4467C4"];
  
    // 创建渐变颜色
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", range[0]);
  
    gradient
      .append("stop")
      .attr("offset", "50%")
      .attr("stop-color", range[1]);
  
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", range[2]);
  
    // 绘制渐变矩形
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", verticalPadding) // 上移开始位置
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)");
  
    // 添加自定义刻度标签
    const labels = colorBy === "Sentiment" ? ["Positive", "Neutral", "Negative"] : ["Subjective", "Mixed", "Objective"];
    const yPositions = [verticalPadding, verticalPadding + legendHeight / 2, verticalPadding + legendHeight]; // 标签位置
  
    labels.forEach((label, index) => {
      legend
        .append("text")
        .attr("x", legendWidth + 10) // 将文本偏移到图例矩形右侧
        .attr("y", yPositions[index]) // 垂直对齐到刻度
        .style("font-size", "12px")
        .style("alignment-baseline", "middle")
        .text(label);
    });
  
    // 调整图例容器的宽度和高度
    d3.select(this.legendRef.current).attr("width", legendWidth + legendPadding).attr("height", legendHeight + 2 * verticalPadding);
  };
  
  
  

  

  render() {
    const { selectedTweets } = this.state;
  
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        {/* Title */}
        <h1 style={{ marginBottom: "10px" }}>Tweet Visualization Dashboard</h1>
  
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "90%", marginBottom: "10px" }}>
          {/* File Upload and Dropdown */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <input type="file" onChange={this.handleFileUpload} style={{ marginRight: "10px" }} />
            <button style={{ marginRight: "10px" }}>Upload</button>
            <select onChange={this.handleColorChange}>
              <option value="Sentiment">Sentiment</option>
              <option value="Subjectivity">Subjectivity</option>
            </select>
          </div>
        </div>
  
        {/* Visualization and Legend */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "80%" }}>
            {/* SVG Chart */}
            <svg ref={this.svgRef} style={{ flex: "1", height: "400px" }}></svg>

            {/* Legend */}
            <svg
              ref={this.legendRef}
              width={50}
              height={150}
              style={{ marginLeft: "20px", flexShrink: "0" }}
            ></svg>
          </div>
        </div>

  
        {/* Selected Tweets */}
        <div style={{ width: "90%", textAlign: "left", marginTop: "20px" }}>
          <h3 style={{ marginBottom: "5px" }}>Selected Tweets:</h3>
          {selectedTweets.map((tweet) => (
            <div key={tweet.idx} style={{ marginBottom: "5px" }}>
              {tweet.RawTweet}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  
  
}

export default App;
