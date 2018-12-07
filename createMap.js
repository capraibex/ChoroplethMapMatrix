function createMap(id, _data, top, left, filename) {

  //var width = document.getElementById("countries-map").offsetWidth - 2,
  //    height = document.getElementById("countries-map").offsetHeight - 2;
  var width = 300,
      height = 300;

  var projection = d3.geoEquirectangular().scale(width*1.2).center([-10,50]).translate([width/12,height/2])
  var path = d3.geoPath().projection(projection);
  
  var colorScale = d3.scaleLinear();
  var quantileEU = d3.scaleQuantile();
  var quantileOther = d3.scaleQuantile();
  var cnt = 0;
  var colors = {};
  var _dataMap = d3.map();
  var dropdown;
  var year;
  
  console.log(_data);
  
  _data.columns.splice(0,1);
  
  if(id.startsWith("i")) {
    dropdown = d3.select("#independentbar").append("select")
      .attr("class", "dd")
      .attr("id", "dropdown"+id)
      .style("left", left+"px")
      .on("change",change);
  }
  else {
    dropdown = d3.select("#dependentbar").append("select")
      .attr("class", "ddrotated")
      .attr("id", "dropdown"+id)
      .style("top", 20+top+"px")
      .on("change",change);
  }
    
  function change() {
    year = document.getElementById("dropdown"+id).value;
    update();
    updateMatrixMaps();
  }
  
  dropdown.selectAll("option").data(_data.columns).enter().append("option")
        .attr("value", function(d){ return d; })
        .text(function(d){ return d; });
        
  //document.getElementById("dropdown"+id).value = year;
  year = document.getElementById("dropdown"+id).value;
    
  var chorMapDIV = d3.select("#charts").append("div")
        .attr("id", id)
        .attr("class", "mapcontainer")
        .style("top", top+"px")
        .style("left", left+"px");
        
  var chorMapSVG = chorMapDIV.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
        .on("zoom", redraw))
        
  chorMapSVG.append("text")
    .attr("class", !top ? "independentLabel" : "dependentLabel")
    .attr("x", !top ? (width/2) : -(width/2))             
    .attr("y", 10)
    .attr("transform", !top ? "" : "rotate(-90)" )
    .attr("text-anchor", "middle")  
    .text(filename);
    
  /*d3.select("#independentbar").append("text")
    .attr("class", !top ? "independentLabel" : "dependentLabel")
    .style("left", !top ? left-20+(width/2)+"px" : -(width/2))             
    .style("transform", !top ? "" : "rotate(-90)" )
    .text(filename);*/
        
  var chorMap = chorMapSVG.append("g");
  
  chorMap.selectAll(".country")
      .data(geoCountries.features)
    .enter().append("path")
      .attr("class", function(d) { return "country " + d.id; })
      .attr("d", path)
      .on("mousemove", function(d){
        if(_dataMap.has(d.id)) {
          updateToolTip((d3.event.pageY-10), (d3.event.pageX+10), null, countryCodes.get(d.id), _dataMap.get(d.id), null);
        }
      })
      .on("mouseout", function(){ d3.select("#tooltip").classed("hidden", true); });

  function chart() {
    update();
    redraw();
  }
  chart.update = update;
  chart.redraw = redraw;

  // function called if zoomed
  function redraw(extern) {
    if(!extern)
      transformAll();
    chorMap.attr("transform", d3.event.transform);
  }
  
  update();

  function update() {
    
    _dataMap.clear();
    _data.forEach(function(d){
      if(d[year] != ""){
        _dataMap.set(d.country, +d[year]);
      }
    })

    minmax = d3.extent(_data.map(function(d){ if(d[year] != "") return +d[year]; }));
    console.log(minmax);
    colorScale.domain(minmax).range([0,1]);
    
    // Update Map
    chorMap.selectAll("path")
        .style("fill", function(d) {
          if(_dataMap.has(d.id)){
            return d3.interpolateGreens(colorScale(_dataMap.get(d.id)));
          }
        })
        .style("stroke", function(d) {
          if(d.id == selectedCountry)
            return d3.rgb(240,59,32);
        })
        .style("stroke-width", function(d) {
          if(d.id == selectedCountry)
            return "2px";
        });

    chorMap.exit().remove();
  }

  // Resize Function
  d3.select(window).on('resize', resize);
  function resize() {
      // adjust things when the window size changes
      //width = document.getElementById("countries-map").offsetWidth,
      //height = document.getElementById("countries-map").offsetHeight;

      // update projection
      projection.scale(width/4);

      // resize the map container
      d3.select("#countries-map").select("svg")
        .attr("width", width)
        .attr("height", height)

      // resize the map
      chorMap.selectAll('.country').attr('d', path);
  }

  return chart;
}
