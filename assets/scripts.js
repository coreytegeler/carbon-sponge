var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var body = document.body;

var testNames = ['MicroBIOMETER', 'Brix', 'pH', 'Temperature', 'Moisture', 'Nodules', 'Rhizosheaths'],
		lineTestNames = ['Brix', 'pH', 'Moisture', 'Nodules', 'Rhizosheaths'];
		barTestNames = ['MicroBIOMETER'];
		tests = {},
		beds = {},
		graphs = {},
		averages = {},
		margin = {top: 30, right: 30, bottom: 30, left: 40};


function Bed(bedId) {
	this.id = bedId;
	this.tests = {};
	this.graph = null;
	this.container = null;
	beds[bedId] = this;
}

function Graph(bedId) {
	this.lines = [];
	this.bars = [];
	var graph = this;
	var bed = beds[bedId];
	graph.createGraph(bed);
	graphs[bedId] = graph;
}

function Test(testName) {
	var testId = slugify(testName);
	this.id = testId;
	this.name = testName;
	this.data = [];
	tests[testId] = this;
}

function initMap() {
	// for(var i = 0; i < 2; i++) {
		// d3.xml("/assets/map"+(i+1)+".svg", function(data) {
	d3.xml("./assets/map.svg", function(data) {
		var mapWrap = d3.select("#beds-map")
				svg = data.documentElement;
		mapWrap
			.append("div")
				.attr("class", "col col-12")
				.node()
			.append(svg);
		var bedsMap = mapWrap.selectAll("svg"),
				hexagons = bedsMap.selectAll("#beds > g");
		hexagons.each(function() {
			var hexagon = this;
					bedId = hexagon.id,
					bedNo = bedId.replace("bed-",""),
					labelText = "Bed No. "+bedNo;

			mapWrap
				.append("div")
					.attr("class", "label bed-label "+bedId)
				.append("span")
					.text(labelText);
			// var wait = Math.random() * 100;
			// setTimeout(function() {
				// d3.select(hexagon).attr("class", "show");
			// }, wait);
		});
		setTimeout(function() {
			bedsMap.attr("class", "show");
		});

		hexagons.on("click", function(e) {
			var hexagon = this,
					bedElemId = hexagon.id,
					bedId = bedElemId.replace("bed-",""),
					bed = beds[bedId];

			var bedsSection = d3.select("section#sect-"+bedId);

			if(bedsSection.size()) {
				bedsSection.classed("show", true)
			} else {
				testNames.forEach(function(testName) {
					var testId = slugify(testName);
					
				});
				bedsSection = d3.select("section#sect-"+bedId);
			}

			d3.selectAll("section:not(#sect-"+bedId+")")
				.classed("show", false);

			// var scrollTop = Math.floor(bedsSection.node().getBoundingClientRect().y - window.scrollY);
			// window.scrollTo(0, scrollTop);

		});
		hexagons.on("mouseover", function(e) {
			var mapWrap = d3.select("#beds-map"),
					hexagon = this,
					bedId = hexagon.id,
					label = mapWrap.select(".label."+bedId);
			label.classed("show", true);
		});

		hexagons.on("mousemove", function(e) {
			var mapWrap = d3.select("#beds-map"),
					hexagon = this,
					bedId = hexagon.id,
					label = mapWrap.select(".label."+bedId);
			var mouse = d3.mouse(hexagon),
					x = mouse[0],
					y = mouse[1],
					left = d3.event.pageX - mapWrap.node().getBoundingClientRect().x + 15,
					top = d3.event.pageY - mapWrap.node().getBoundingClientRect().y - window.scrollY;

			label.attr("style", "left:"+left+"px; top:"+top+"px;")
		});

		hexagons.on("mouseleave", function(e) {
			var mapWrap = d3.select("#beds-map"),
					hexagon = this,
					bedId = hexagon.id,
					label = mapWrap.select(".label."+bedId);
			label.classed("show", false);
		});
	});
	// }
}

Graph.prototype.addLine = function(bed, testName, graphWrap) {
	var graph = this,
			testId = slugify(testName),
			testData = bed.tests[testId].data;
	var svg = graph.svg,
			width = svg.attr("width"),
			height = svg.attr("height");

	var g = svg.select(".features")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);
	x.domain(d3.extent(bed.lineData, function(d) { return d.date; }));
	y.domain([0, d3.max(bed.lineData, function(d) { return d.value; })]);

	var line = d3.line()
		.curve(d3.curveCatmullRom)
		// .curve(d3.curveStepBefore)
		// .curve(d3.curveStepAfter)
		// .curve(d3.curveStep)
		// .curve(d3.curveLinear)
		.x(function(d) { return x(d.date); })
		// .y0(height)
		.y(function(d) { return y(d.value); });

	g.append("path")
		.datum(testData)
		.attr("class", "line "+testId)
		.attr("data-test", testId)
		.attr("id", testId+"-"+bed.id)
		.attr("d", line);

	graph.lines[testId] = line;
}


Graph.prototype.addBar = function(bed, testName, graphWrap) {
	var graph = this,
			testId = slugify(testName),
			testData = bed.tests[testId].data;
	var svg = graph.svg,
			width = svg.attr("width"),
			height = svg.attr("height");

	var g = svg.select(".features")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);
	x.domain(d3.extent(bed.barData, function(d) { return d.date; }));
	y.domain([0, d3.max(bed.barData, function(d) { return d.value; })]);


	// var bar = d3.line()
		// .curve(d3.curveLinear)
		// .x(function(d) { return x(d.date); })
		// .y0(height)
		// .y1(function(d) { return y(d.value); });

	// g.append("path")
	// 	.datum(testData)
	// 	.attr("class", "line "+testId)
	// 	.attr("data-test", testId)
	// 	.attr("id", testId+"-"+bed.id)
	// 	.attr("d", line);

	// graph.lines[testId] = line;
}

Graph.prototype.createGraph = function(bed) {
	var graph = this;
	var lineData = [];
	var barData = [];

	lineTestNames.forEach(function(testName) {
		var testId = slugify(testName);
		var test = bed.tests[testId];
		lineData = lineData.concat(test.data);
	});
	bed.lineData = lineData;

	barTestNames.forEach(function(testName) {
		var testId = slugify(testName);
		var test = bed.tests[testId];
		barData = barData.concat(test.data);
	});
	bed.barData = barData;


	var wrapperWidth = 1000,
			wrapperHeight = 600,
			tickSize = 15;

	var width = wrapperWidth - margin.left - margin.right,
			height = wrapperHeight - margin.top - margin.bottom;
			
	var svg = bed.container.select(".bed-graph")
			.append("svg")
				.attr('id', bed.id+'-compare')
				.attr('width', width)
				.attr('height', height)
				.attr("preserveAspectRatio", "xMinYMin meet")
				.attr("viewBox", "0 0 "+wrapperWidth+" "+wrapperHeight );

	graph.svg = svg;

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]),
			y2 = d3.scaleLinear().range([height, 0]);;

	var xAxis = d3.axisBottom(x).tickSize(tickSize,0),
			yAxis = d3.axisLeft(y).tickSize(tickSize,0);
			y2Axis = d3.axisRight(y2).tickSize(tickSize,0);

	var zoom = d3.zoom()
			.scaleExtent([1, 32])
			.translateExtent([[0, 0], [width, height]])
			.extent([[0, 0], [width, height]])
			.on("zoom", function() {
				var t = d3.event.transform,
						xt = t.rescaleX(x);
				svg.selectAll(".line").each(function(data,i) {
					var path = d3.select(svg.selectAll(".line").nodes()[i]);
					var testId = path.attr("data-test");
					var line = graph.lines[testId];
					path.attr("d", line.x(function(d) {
						return xt(d.date);
					}));
				});
				svg.select(".axis--x").call(xAxis.scale(xt));
			});

	x.domain(d3.extent(lineData, function(d) { return d.date; }));
	y.domain([0, d3.max(lineData, function(d) { return d.value; })]);
	y2.domain([0, d3.max(barData, function(d) { return d.value; })]);

	var features = svg.append("g")
			.attr("class", "features");

	lineTestNames.forEach(function(testName) {
		graph.addLine(bed, testName);
	});

	barTestNames.forEach(function(testName) {
		graph.addBar(bed, testName);
	});

	var axes = svg.append("g")
			.attr("class", "axes")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	axes.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

	axes.append("g")
			.attr("class", "axis axis--y")
			.call(yAxis);

	axes.append("g")
			.attr("class", "axis axis--y2")
			.attr("transform", "translate(" + width + ",0)")
			.call(y2Axis);

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", width)
			.attr("height", height+20)
			.attr("transform", "translate(0,-20)");

	svg.call(zoom);
}

Bed.prototype.buildBed = function() {
	var bed = this,
			bedId = bed.id;

	var bedsSection = d3.select("#beds-list")
			.append("section")
				.attr("class", "bed")
				.attr("id", "sect-"+bedId);

	bedsSection.append("h2")
		.attr("class", "section-title")
		.text(bed.id);

	var graphWrap = bedsSection
			.append("div")
			// .attr("class", "graphs-wrapper");
			.attr("class", "graph-wrapper row");

	var testGraph = graphWrap.append("div")
			.attr("class", "bed-graph col col-12 col-md-9");

	var testInfo = graphWrap.append("div")
			.attr("class", "bed-graph-info col col-12 col-md-3");

	bed.container = bedsSection;
	bed.graph = new Graph(bedId);

	testNames.forEach(function(testName, i) {
		var testId = slugify(testName);

		testGraph
			.append("div")
				.attr("data-test", testId)
				.attr("class", "label bed-label "+testId)
			.append("span")
				.text(testName);

		var filter = testInfo
			.append("div")
				.attr("data-test", testId)
				.attr("class", "button filter-button "+testId)
		filter
			.append("span")
				.text(testName);

		filter.on("mouseover", function() {
			var filter = this,
					testId = filter.dataset.test,
					line = testGraph.select(".line."+testId);
			if(line.empty()) {return}
			var parent = line.node().parentNode;
			parent.parentNode.appendChild(parent);
			line.classed("hover", true);
			svg.classed("hover", true);
		});

		filter.on("mouseleave", function() {
			var filter = this,
					testId = filter.dataset.test,
					line = testGraph.select(".line."+testId);
			if(line.empty()) {return}
			line.classed("hover", false);
			svg.classed("hover", false);
		});


	});
	var svg = bed.graph.svg,
			lines = svg.selectAll(".line");

	lines.on("mouseover", function(e) {
		var line = this,
				testId = line.dataset.test,
				label = testGraph.select(".label."+testId);

		var parent = line.parentNode;
		parent.parentNode.appendChild(parent);
		label.classed("show", true);
		svg.classed("hover", true);
		// hexagon.style('fill', 'red');
	});

	lines.on("mousemove", function(e) {
		var line = this,
				testId = line.dataset.test,
				label = testGraph.select(".label."+testId);
		var mouse = d3.mouse(line),
				x = mouse[0],
				y = mouse[1],
				left = d3.event.pageX - testGraph.node().getBoundingClientRect().x + 15,
				top = d3.event.pageY - testGraph.node().getBoundingClientRect().y - window.scrollY;

		label.attr("style", "left:"+left+"px; top:"+top+"px;")
	});

	lines.on("mouseleave", function(e) {
		var line = this,
				testId = line.dataset.test,
				label = testGraph.select(".label."+testId);
		label.classed("show", false);
		svg.classed("hover", false);
	});
};

function averageData(testName) {
	var testId = slugify(testName),
			test = tests[testId].data,
			dates = {},
			sum = 0;
	test.forEach(function(entry, i) {
		if(!dates[entry.date]) {
			dates[entry.date] = [];
		}
		sum += entry.value;
		dates[entry.date].push(entry.value);
	});
	var orderedDates = [],
			orderedValues =[];
	Object.keys(dates).forEach(function(date, i){
		orderedDates.push(new Date(date));
	});
	orderedDates.sort(function(a, b) {
		return new Date(b) - new Date(a);
	});
	orderedDates.forEach(function(date, i) {
		var values = dates[date],
				sum = 0;
		values.forEach(function(value, j) {
			sum += value;
		});
		var avg = sum/values.length;
		orderedValues[i] = {
			date: date,
			value: avg
		}
	});
}

function handleData(resultData) {
	testNames.forEach(function(testName, i) {
		var testData = resultData[i].result.values,
				testId = slugify(testName);
		var parseDate = d3.timeParse("%b %Y");
		var headers = testData.shift();
		headers.shift();
		testData.forEach(function(bedRowData, j) {
			var bedId = bedRowData.shift();
			if(!beds[bedId]) {
				beds[bedId] = new Bed(bedId);
			}
			beds[bedId].tests[testId] = new Test(testName);
			bedRowData.forEach(function(testValue, l) {
				var date = new Date(headers[l]);
				var value = testValue ? parseInt(testValue) : 0;
				if(!value || !date) {return}
				var entry = {
					date: date,
					value: value
				};
				beds[bedId].tests[testId].data.push(entry);
			});
			if(Object.keys(beds[bedId].tests).length == 7) {
				beds[bedId].buildBed();
			}
		});
	});
}

function handleTestInfo(sheetData) {
	var testData = sheetData.result.values;
	var testInfo = d3.select("#tests-info");
	testData.shift();
	testData.forEach(function(row, i) {
		var testName = row[0],
				testId = slugify(testName);
		tests[testId] = {
			name: testName,
			id: testId,
			unit: row[1],
			about: row[2]
		};
		testInfo.append("div")
				.attr("class", "test-block "+testId)
			.append("h3")
				.attr("class", "test-title")
				.text(testName);
	});
}

function getData() {
	var requests = [];
	var sheetNames = testNames.slice(0);
	sheetNames.unshift('Tests');
	sheetNames.forEach(function(sheetName, i) {
		var params = {
			spreadsheetId: SPREADSHEET_ID,
			range: "'"+sheetName+"'",
			majorDimension: "ROWS"
		};

		var promise = new Promise(function(resolve, reject) {
			var request = gapi.client.sheets.spreadsheets.values.get(params);
			request.then(function(response) {
				var sheetData = response.result.values;
				resolve(sheetData);
			}, function(reason) {
				console.error("error: " + reason.result.error.message);
			});
			requests.push(request);
		});
	});

	Promise.all(requests).then(function(values) {
		handleTestInfo(values.shift());
		handleData(values);
	});
}

function slugify(string) {
	return string
		.toLowerCase()
		.replace(/ /g,"-")
		.replace(/[^\w-]+/g,"-");
}

window.onload = function() {
	initMap();
}

function initClient() {
	gapi.client.init({
		"apiKey": API_KEY,
		"clientId": CLIENT_ID,
		"scope": SCOPE,
		"discoveryDocs": ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
	}).then(function() {
		getData();
	});
}

function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}