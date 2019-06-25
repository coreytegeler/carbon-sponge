var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var body = document.body;

var testNames = ['MicroBIOMETER', 'Brix', 'pH', 'Nodules', 'Rhizosheaths', 'Moisture', 'Temperature'];
		tests = {},
		beds = {},
		graphs = {},
		averages = {},
		margin = {top: 30, right: 30, bottom: 30, left: 70};


function Bed(bedId) {
	this.id = bedId;
	this.tests = {};
	this.graph = null;
	this.data = [];
	this.container = null;
	beds[bedId] = this;
}

function Graph(bedId) {
	var graph = this,
			bed = beds[bedId];
	this.bed = bed;
	this.lines = [];
	this.bars = [];
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

			var bedsList = d3.select("#beds-list");
			var bedSection = d3.select("section#sect-"+bedId);
			if(bedSection.size()) {
				bedSection.classed("show", true);
				d3.select(hexagon).classed("active", true);
			}
			d3.selectAll("section:not(#sect-"+bedId+")")
				.classed("show", false);
			hexagons.filter(".active:not(#bed-"+bedId+")")
				.classed("active", false);

			$('html, body').animate({
				scrollTop: bedsList.node().getBoundingClientRect().y + window.scrollY
			}, 200);
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

Graph.prototype.toggleFilter = function(testId) {
	var graph = this,
		bed = graph.bed,
		svg = graph.svg,
		container = bed.container,
		filter = container.select(".filter-button."+testId)
		line = svg.select(".line."+testId),
		yAxis = svg.select(".y-axis."+testId);
	filter.classed("active", !filter.node().classList.contains("active"));
	svg.classed("active", !svg.node().classList.contains("active"));
	line.classed("show", !line.node().classList.contains("show"));
	d3.select(line.node().parentNode).raise();

	var showing = svg.selectAll(".line.show");
	if(showing.size() == 1) {
		graph.focusTest(showing.attr("data-test"));
	} else {
		testNames.forEach(function(otherTestName) {
			var otherTestId = slugify(otherTestName);
			if(otherTestId != testId) {
				graph.blurTest(otherTestId);
			}
		});
	}
}

Graph.prototype.hoverTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId)
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId);
	svg.classed("hover", true);
	line.classed("hover", true);
	yAxis.classed("show", true);
	d3.select(line.node().parentNode).raise();
}

Graph.prototype.unhoverTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId),
			label = container.select(".label."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId);
	svg.classed("hover", false);
	line.classed("hover", false);
	label.classed("show", false);
	yAxis.classed("show", false);
	d3.select(line.node().parentNode).raise();
}

Graph.prototype.focusTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId);

	testNames.forEach(function(otherTestName) {
		var otherTestId = slugify(otherTestName);
		if(otherTestId != testId) {
			graph.hideTest(otherTestId);
			graph.blurTest(otherTestId);
		}
	});

	filter.classed("active", true);
	svg.classed("focus", true);
	line.classed("focus show", true);
	yAxis.classed("focus show", true);
	d3.select(line.node().parentNode).raise();
};

Graph.prototype.blurTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId),
			label = container.select(".label."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId);
	// filter.classed("active", false);
	svg.classed("focus", false);
	line.classed("focus", false);
	yAxis.classed("focus", false);
};

Graph.prototype.hideTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId),
			label = container.select(".label."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId);
	filter.classed("active", false);
	line.classed("show", false);
	yAxis.classed("show", false);
}

Graph.prototype.addLine = function(bed, testName, isAvg) {
	var graph = this,
			testId = slugify(testName),
			testData = isAvg ? averages[testId] : bed.tests[testId].data;

	var svg = graph.svg,
			width = svg.attr("width"),
			height = svg.attr("height");

	var g = svg.select(".features")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);
	x.domain(d3.extent(bed.data, function(d) { return d.date; }));
	y.domain([0, d3.max(testData, function(d) { return d.value; })]);

	var line = d3.line()
		.curve(d3.curveCatmullRom)
		// .curve(d3.curveLinear)
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.value); });

	g.append("path")
		.datum(testData)
		.attr("class", "line "+(isAvg ? "avg avg-" : "show ")+testId)
		.attr("data-test", testId)
		.attr("id", testId+"-"+bed.id+(isAvg ? "-avg" : ""))
		.attr("d", line);

	graph.lines[testId] = line;
}

Graph.prototype.addBar = function(bed, testName) {
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
	testNames.forEach(function(testName) {
		var testId = slugify(testName);
		var test = bed.tests[testId];
		bed.data = bed.data.concat(test.data);
	});

	// barTestNames.forEach(function(testName) {
	// 	var testId = slugify(testName);
	// 	var test = bed.tests[testId];
	// 	barData = barData.concat(test.data);
	// });
	// bed.barData = barData;


	var yOffset = 20,
			wrapperWidth = 1000,
			wrapperHeight = 600,
			tickSize = 15;

	var width = wrapperWidth - margin.left - margin.right,
			height = wrapperHeight - margin.top - margin.bottom - yOffset;
			
	var svg = bed.container.select(".bed-graph")
			.append("svg")
				.attr('id', bed.id+'-compare')
				.attr('width', width)
				.attr('height', height)
				.attr("preserveAspectRatio", "xMinYMin meet")
				.attr("viewBox", "0 0 "+wrapperWidth+" "+wrapperHeight );

	graph.svg = svg;

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);
			// y2 = d3.scaleLinear().range([height, 0]);

	var xAxis = d3.axisBottom(x).tickSize(tickSize,0),
			yAxis = d3.axisLeft(y).tickSize(tickSize,0);
			// y2Axis = d3.axisRight(y2).tickSize(tickSize,0);

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
				svg.select(".x-axis").call(xAxis.scale(xt));
			});

	x.domain(d3.extent(bed.data, function(d) { return d.date; }));
	// y.domain([0, d3.max(lineData, function(d) { return d.value; })]);
	// y2.domain([0, d3.max(barData, function(d) { return d.value; })]);

	var features = svg.append("g")
			.attr("class", "features");

	var axes = svg.append("g")
			.attr("class", "axes")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	axes.append("g")
			.attr("class", "axis x-axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

	testNames.forEach(function(testName) {
		var testId = slugify(testName),
				testData = bed.tests[testId].data;

		y.domain([0, d3.max(testData, function(d) { return d.value; })]);
		axes.append("g")
			.attr("class", "axis y-axis "+testId)
			.call(yAxis);

		graph.addLine(bed, testName);
		graph.addLine(bed, testName, true);
	});

	// barTestNames.forEach(function(testName) {
	// 	graph.addBar(bed, testName);
	// });

	// axes.append("g")
	// 		.attr("class", "axis y-axis2")
	// 		.attr("transform", "translate(" + width + ",0)")
	// 		.call(y2Axis);

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", width)
			.attr("height", height+yOffset)
			.attr("transform", "translate(0,-"+yOffset+")");

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
				.attr("class", "button filter-button active "+testId)
		filter
			.append("span")
				.text(testName);
	});

	var svg = bed.graph.svg,
			container = bed.container,
			lines = svg.selectAll(".line"),
			filters = container.selectAll(".filter-button");

	filters.on("click", function() {
		var testId = d3.select(this).attr("data-test");
		bed.graph.toggleFilter(testId);
	});

	filters.on("mouseover", function() {
		var testId = d3.select(this).attr("data-test");
		bed.graph.hoverTest(testId);
	});

	filters.on("mouseleave", function() {
		var testId = d3.select(this).attr("data-test");
		bed.graph.unhoverTest(testId);
	});

	lines.on("mouseover", function(e) {
		var testId = d3.select(this).attr("data-test");
		bed.graph.hoverTest(testId);
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

		label.classed("show", true);
		label.attr("style", "left:"+left+"px; top:"+top+"px;")
	});

	lines.on("click", function(e) {
		var testId = d3.select(this).attr("data-test");
		bed.graph.focusTest(testId);
	});

	lines.on("mouseleave", function(e) {
		var testId = d3.select(this).attr("data-test");
		bed.graph.unhoverTest(testId);
	});


	testInfo.append("div")
		.attr("class", "help filter-help")
		.text("Toggle the buttons above to hide or show different test results on the graph.");
};

function handleAverageData(testName) {
	var testId = slugify(testName),
			test = tests[testId].data,
			dates = {},
			sum = 0;
	averages[testId] = [];
	test.forEach(function(entry, i) {
		if(!dates[entry.date]) {
			dates[entry.date] = [];
		}
		sum += entry.value;
		dates[entry.date].push(entry.value);
	});
	var orderedDates = [];
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
		averages[testId].push({
			date: date,
			value: avg
		});
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
			// if(Object.keys(beds[bedId].tests).length == 7) {
			// 	beds[bedId].buildBed();
			// }
		});
		handleAverageData(testName);
	});
	Object.keys(beds).forEach(function(bedId, i) {
		var bed = beds[parseInt(bedId)];
		if(bed) {
			bed.buildBed();
		} else {
		}
	});
}

function handleTestInfoData(sheetData) {
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

function getAllData() {
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
		handleTestInfoData(values.shift());
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
		getAllData();
	});
}

function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}