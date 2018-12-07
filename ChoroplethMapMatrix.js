function ChoroplethMapMatrix() {
  var independentMaps = [];
  var independentData = [];
  var dependentMaps = [];
  var dependentData = [];
  var matrixMaps = [];
  var size = 300;
  var newsize = 300;
  var margin = 5;
  var matrixIdc = d3.set();
  
  function oldsize(x){
    return (x+1)*(size+margin);
  }
  
  function getsize(x){
    return (x+1)*(newsize+margin);
  }
  
  function readFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(f) {
      var contents = f.target.result;
      parse(e.target.id, contents, file.name);
      updateMatrix();
    };
    reader.readAsText(file);
  }
  
  function parse(type, contents, filename){
    var data = d3.tsvParse(contents);
    if(type == "addIndependent"){
      independentData.push(data);
      l = independentMaps.length;
      independentMaps.push(createMap("i"+l, data, 0, oldsize(l), filename));
    }
    else{
      dependentData.push(data);
      l = dependentMaps.length;
      dependentMaps.push(createMap("d"+l, data, oldsize(l), 0, filename));
    }
  }
  
  function updateMatrix(){
    //createMap(1, gdp)
    //console.log(independentData);
    //console.log(dependentData);
    
    newsize = d3.min([size, (document.getElementById("charts").offsetHeight-25)/(dependentMaps.length+1)]);
    
    il = independentMaps.length;
    dl = dependentMaps.length;
    
    for(i=0; i<il; i++){
      for(d=0; d<dl; d++){
        if(!matrixIdc.has(i+""+d)){
          matrixIdc.add(i+""+d);
          matrixMaps.push(createMatrixMap("m"+i+""+d, independentData[i],dependentData[d], oldsize(d), oldsize(i)));
        }
      }
    }
    
    // update sizes and positions
    if(size != newsize){
      d3.selectAll(".mapcontainer").style("width", newsize+"px").style("height", newsize+"px");
      d3.selectAll("svg").attr("width", newsize+"px").attr("height", newsize+"px");
      d3.selectAll(".independentLabel").attr("x", newsize/2+"px");
      d3.selectAll(".dependentLabel").attr("x", -(newsize/2)+"px");
      
      independentMaps.forEach(function(d,i){ d3.selectAll("#i"+i).style("left", getsize(i)+"px"); d3.select("#dropdowni"+i).style("left", getsize(i)+"px");});
      dependentMaps.forEach(function(d,i){ d3.selectAll("#d"+i).style("top", getsize(i)+"px"); d3.select("#dropdownd"+i).style("top", 20+getsize(i)+"px");});
      
      matrixIdc.each(function(idx){ 
        i = Number(idx.slice(0,1));
        d = Number(idx.slice(1,2));
        d3.selectAll("#m"+idx).style("top", getsize(d)+"px").style("left", getsize(i)+"px"); 
      });
    }
  }
  
  function transformAll(){
    independentMaps.forEach(function(d){ d.redraw(true) });
    dependentMaps.forEach(function(d){ d.redraw(true) });
    matrixMaps.forEach(function(d){ d.redraw(true) });
  }
  
  function switchlinlog(e){
    matrixMaps.forEach(function(d){ d.switchlinlog(e.target.selectedIndex) });
  }
  
  function updateMatrixMaps(){
    matrixMaps.forEach(function(d){ 
      d.update();
    });
  }
  
  document.getElementById("addIndependent").addEventListener('change', readFile, false);
  document.getElementById("addDependent").addEventListener('change', readFile, false);
  document.getElementById("dropdown").addEventListener('change', switchlinlog, false);
  
  function chart() {
    transformAll();
    updateMatrixMaps();
  }
  chart.transformAll = transformAll;
  chart.updateMatrixMaps = updateMatrixMaps;
  
  return chart;
}
