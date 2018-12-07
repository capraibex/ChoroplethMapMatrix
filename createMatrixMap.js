function createMatrixMap(id, _data1, _data2, top, left) {

  //var width = document.getElementById("countries-map").offsetWidth - 2,
  //    height = document.getElementById("countries-map").offsetHeight - 2;
  var width = 300,
      height = 300;

  var projection = d3.geoEquirectangular().scale(width*1.2).center([-10,50]).translate([width/12,height/2])
  var path = d3.geoPath().projection(projection);
  
  var offsetScale = d3.scaleLinear();
  var correlationScale = d3.scaleLinear().domain([-1,1]).range([1,0]);
  var quantileEU = d3.scaleQuantile();
  var quantileOther = d3.scaleQuantile();
  var cnt = 0;
  var colors = {};
  var line;
  var offsetArray = [];
  var kd;
  var regPoints = [];
  var _data = d3.map();
  var ind_lin;
  var dep_lin;
  var corrcoeff;
  
  var iyear = document.getElementById("dropdowni"+id.charAt(1)).value;
  var dyear = document.getElementById("dropdownd"+id.charAt(2)).value;
  
  setLinLogVars(document.getElementById("dropdown").selectedIndex);
  
  function calcRegression(){
    iyear = document.getElementById("dropdowni"+id.charAt(1)).value;
    dyear = document.getElementById("dropdownd"+id.charAt(2)).value;
    
    offsetArray = [];
    regPoints = [];
    _data.clear();
    
    xs = [];
    ys = [];
    
    _data1.forEach(function(d){
      _data2.forEach(function(e){
        if(d.country == e.country && d[iyear] != "" && e[dyear] != ""){
          regPoints.push([ind_linlog(+d[iyear]), dep_linlog(+e[dyear])]);
          xs.push(ind_linlog(+d[iyear]));
          ys.push(dep_linlog(+e[dyear]));
          return _data.set(d.country,
            { dataX: ind_linlog(+d[iyear]),
              dataY: dep_linlog(+e[dyear]),
              point: [ind_linlog(+d[iyear]), dep_linlog(+e[dyear])]
            });
        }
      })
    });
    
    corrcoeff = jStat.corrcoeff(xs, ys);

    kd = ss.linearRegression(regPoints);
    line = ss.linearRegressionLine(kd);
    _data.each(function(d){
      y = line(d.dataX);
      offset = d.dataY - y;
      d.offset = offset;
      offsetArray.push(offset);
    })
  }
  
  function ind_linlog(x){
    return ind_lin ? x : (x!=0) ? Math.log(x) : 1;
  }
  
  function dep_linlog(x){
    return dep_lin ? x : (x!=0) ? Math.log(x) : 1;
  }
  
  function setLinLogVars(idx){
    switch(idx){
      case 0:
        ind_lin = true;
        dep_lin = true;
        break;
      case 1:
        ind_lin = true;
        dep_lin = false;
        break;
      case 2:
        ind_lin = false;
        dep_lin = true;
        break;
      case 3:
        ind_lin = false;
        dep_lin = false;
        break;
    }
  }
  
  function switchlinlog(value){
    setLinLogVars(value);
    calcRegression();
    //chorMapSVG.select("text").text(""+kd.m.toFixed(2)+","+kd.b.toFixed(2));
    chorMapSVG.select("text").text(""+corrcoeff.toFixed(3));
    update();
  }
  
  var chorMapDIV = d3.select("#charts").append("div")
        .attr("id", id)
        .attr("class", "mapcontainer")
        .style("top", top+"px")
        .style("left", left+"px");
        
  var chorMapSVG = chorMapDIV.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
        .on("zoom", redraw));
  
  chorMapSVG.append("text")
    //.attr("class", "dependentLabel")
    .attr("x", 10)             
    .attr("y", 10)
    .attr("text-anchor", "left");
    
      
  var chorMap = chorMapSVG.append("g");

  chorMap.selectAll(".country")
      .data(geoCountries.features)
    .enter().append("path")
      .attr("class", function(d) { return "country " + d.id; })
      .attr("d", path)
      .on("mousemove", function(d){
        if(_data.has(d.id)) {
          values = _data.get(d.id);
          updateToolTip((d3.event.pageY-10), (d3.event.pageX+10), null, countryCodes.get(d.id), "x: "+values.dataX.toFixed(2)+", y: "+values.dataY.toFixed(2), "offset: "+values.offset.toFixed(2));
        }
      })
      .on("mouseout", function(){ d3.select("#tooltip").classed("hidden", true); });

  function chart() {
    update();
    redraw();
    switchlinlog(value);
  }
  chart.update = update;
  chart.redraw = redraw;
  chart.switchlinlog = switchlinlog;

  // function called if zoomed
  function redraw(extern) {
    if(!extern)
      transformAll();
    chorMap.attr("transform", d3.event.transform);
  }
  
  update();

  function update() {
    
    calcRegression();
    
    console.log(id,"k: "+kd.m,"d: "+kd.b);
    
    minmax = d3.extent(offsetArray);
    max_ = d3.max([Math.abs(minmax[0]),Math.abs(minmax[1])]);
    //console.log(minmax);
    offsetScale.domain([-max_, max_]).range( (max_ != 0) ? [1,0] : [0.5,0.5]);
    
    
    // Update Map
    chorMap.selectAll("path")
        .style("fill", function(d) {
          if(_data.has(d.id)){
            c = _data.get(d.id).offset;
            return d3.interpolateRdBu(offsetScale(c));
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
    
    chorMapDIV.style("border", "2px solid "+d3.interpolateRdBu(correlationScale(corrcoeff)));
    chorMapSVG.style("background-color", (corrcoeff > 0) ? colorPos : colorNeg);
    chorMapSVG.select("text").text(""+corrcoeff.toFixed(3));
    
    //chorMapSVG.style("background-color", (kd.m > 0) ? colorPos : colorNeg);
    //chorMapSVG.select("text").text(""+kd.m.toFixed(2)+","+kd.b.toFixed(2));
  }
  
  function calcOffset(x,y) {
    return y - line(x);
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
