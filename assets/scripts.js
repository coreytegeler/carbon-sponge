var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var body = document.body;

var testNames = ['MicroBIOMETER', 'Brix', 'pH', 'Nodules', 'Rhizosheaths', 'Moisture', 'Temperature'],
		tests = {},
		beds = {},
		graphs = {},
		tables = {},
		averages = {},
		map = null,
		margin = {top: 30, right: 30, bottom: 30, left: 100};


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

function Table(bedId) {
	var table = this,
			bed = beds[bedId];
	this.bed = bed;
	table.createTable(bed);
	tables[bedId] = table;
}

function Test(testName) {
	var testId = slugify(testName);
	this.id = testId;
	this.name = testName;
	this.data = [];
	tests[testId] = Object.assign(tests[testId], this);
}


Bed.prototype.openBed = function() {
	var bed = this,
			bedId = bed.id,
			bedsNames = d3.select("#beds-names"),
			bedsList = d3.select("#beds-list"),
			bedSection = d3.select("section#sect-"+bedId),
			bedIcons = map.selectAll("#beds > g");

	bedSection.classed("show", true);
	map.select("#bed-"+bedId).classed("active", true);
	bedsNames.select(".bed-name[data-id=\""+bedId+"\"]").classed("active", true);

	d3.selectAll("section:not(#sect-"+bedId+")")
		.classed("show", false);
	bedIcons.filter(".active:not(#bed-"+bedId+")")
		.classed("active", false);
	bedsNames.selectAll(".bed-name:not([data-id=\""+bedId+"\"]")
		.classed("active", false);

	$('html').animate({
		scrollTop: bedsList.node().getBoundingClientRect().y + $('html').scrollTop()
	}, 400);
}


function initMap() {
	// for(var i = 0; i < 2; i++) {
		// d3.xml("/assets/map"+(i+1)+".svg", function(data) {
	var bedsMap = d3.select("#beds-map"),
			bedsNames = d3.select("#beds-names");

	d3.xml("./assets/map.svg", function(data) {
		
		var svg = data.documentElement;
		map = bedsMap;

		bedsMap
			.append("div")
				.attr("class", "col col-12")
				.node()
			.append(svg);

		var mapSvg = bedsMap.select("svg"),
				bedIcons = mapSvg.selectAll("#beds > g");



		bedIcons.each(function(g, i) {
			var bedIcon = this;
					bedId = bedIcon.id,
					bedNo = bedId.replace("bed-",""),
					labelText = "Bed No. "+bedNo;

			bedsMap
				.append("div")
					.attr("class", "label bed-label "+bedId)
				.append("span")
					.text(labelText);
			
			bedsNames
				.append("span")
				.attr("class", "bed-name")
				.attr("data-id", i+1)
				.text(i+1);
		});

		bedIcons.on("click", function(e) {
			var bedIcon = this,
					bedElemId = bedIcon.id,
					bedId = bedElemId.replace("bed-",""),
					bed = beds[bedId];
			bed.openBed();
		});

		bedsNames.selectAll(".bed-name").on("click", function(e) {
			var bedId = this.dataset.id,
					bed = beds[bedId];
			bed.openBed();
		});

		bedIcons.on("mouseover", function(e) {
			var bedsMap = d3.select("#beds-map"),
					bedIcon = this,
					bedId = bedIcon.id,
					label = bedsMap.select(".label."+bedId);
			label.classed("show", true);
		});

		bedIcons.on("mousemove", function(e) {
			var bedsMap = d3.select("#beds-map"),
					bedIcon = this,
					bedId = bedIcon.id,
					label = bedsMap.select(".label."+bedId);
			var mouse = d3.mouse(bedIcon),
					x = mouse[0],
					y = mouse[1],
					left = d3.event.pageX - bedsMap.node().getBoundingClientRect().x + 15,
					top = d3.event.pageY - bedsMap.node().getBoundingClientRect().y - window.scrollY;

			label.attr("style", "left:"+left+"px; top:"+top+"px;")
		});

		bedIcons.on("mouseleave", function(e) {
			var bedsMap = d3.select("#beds-map"),
					bedIcon = this,
					bedId = bedIcon.id,
					label = bedsMap.select(".label."+bedId);
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
		filter = container.select(".filter-button."+testId),
		line = svg.select(".line."+testId);
	filter.classed("active", !filter.node().classList.contains("active"));
	svg.classed("active", !svg.node().classList.contains("active"));
	line.classed("show", !line.node().classList.contains("show"));
	d3.select(line.node().parentNode).raise();

	var showing = svg.selectAll(".line.show");
			showingSize = showing.size();
	if(showingSize == 0) {
		graph.blurTest(testId);
	} else if(showingSize == 1) {
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
			filter = container.select(".filter-button."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId),
			yAxisLabel = svg.select(".y-axis-label."+testId);
	svg.classed("hover", true);
	line.classed("hover", true);
	yAxis.classed("show", true);
	yAxisLabel.classed("show", true);
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
			yAxis = svg.select(".y-axis."+testId),
			yAxisLabel = svg.select(".y-axis-label."+testId);
	svg.classed("hover", false);
	line.classed("hover", false);
	label.classed("show", false);
	yAxis.classed("show", false);
	yAxisLabel.classed("show", false);
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
			yAxisLabel = svg.select(".y-axis-label."+testId);

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
	yAxisLabel.classed("focus show", true);
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
			yAxis = svg.select(".y-axis."+testId),
			yAxisLabel = svg.select(".y-axis-label."+testId);
	// filter.classed("active", false);
	svg.classed("focus", false);
	line.classed("focus", false);
	yAxis.classed("focus", false);
	yAxisLabel.classed("focus", false);
};

Graph.prototype.hideTest = function(testId) {
	var graph = this,
			bed = graph.bed,
			svg = graph.svg,
			container = bed.container,
			filter = container.select(".filter-button."+testId),
			label = container.select(".label."+testId),
			line = svg.select(".line."+testId),
			yAxis = svg.select(".y-axis."+testId),
			yAxis = svg.select(".y-axis-label."+testId);
	filter.classed("active", false);
	line.classed("show", false);
	yAxis.classed("show", false);
	yAxisLabel.classed("show", false);
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

Table.prototype.createTable = function(bed) {
	// var table = this,
	// 		tests = bed.tests,
	// 		testKeys = Object.keys(tests);

	// var tablesWrap = d3.select("#tables");

	// testKeys.forEach(function(testKey, i) {
	// 	var testObj = tests[testKey],
	// 			testName = testObj.name,
	// 			testData = testObj.data;
	// 	testData.forEach(function(testDatum, i) {
	// 		var date = testDatum.date,
	// 				value = testDatum.value;

	// 		var row = tablesWrap.select("[data-date='"+date+"']");
	// 		if(row.empty()) {
	// 			row = tablesWrap.append("div")
	// 				.attr("class", "row")
	// 				.attr("data-date", date)
	// 				.text(date);
	// 		}
			
	// 	});
	// });

	
	// var tableWrap = tablesWrap
	// 		.append("div")
	// 			.attr("class", "col-12 col-md-6 col-xl-4 test-info "+testId)
	// 			.attr("data-test", testId)
	// 		.append("div")
	// 			.attr("class", "test-info-inner color");

	// 	testInfo
	// 		.append("h3")
	// 			.attr("class", "color")
	// 			.text(testName);

	// 	var formatTime = d3.timeFormat("%B %d, %Y");
}

Graph.prototype.createGraph = function(bed) {
	var graph = this;
	testNames.forEach(function(testName) {
		var testId = slugify(testName);
		var test = bed.tests[testId];
		bed.data = bed.data.concat(test.data);
	});

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
	var xAxis = d3.axisBottom(x).tickSize(tickSize,0).tickFormat(d3.timeFormat("%b %d")),
			yAxis = d3.axisLeft(y).tickSize(tickSize,0);

	var zoom = d3.zoom()
			.scaleExtent([3, 8])
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
				svg.select(".x-axis").call(xAxis.scale(xt).ticks(d3.timeDay.every(1)));
			});

	x.domain(d3.extent(bed.data, function(d) { return d.date; }));

	var features = svg.append("g")
			.attr("class", "features");

	var axes = svg.append("g")
			.attr("class", "axes")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	axes.append("g")
			.attr("class", "axis x-axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

	axes.append("text")
			.attr("class", "axis-label y-axis-label default")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x",-height/2)
      .attr("dy", "-1em")
      .style("text-anchor", "middle")
	    .text("Hover or select a line to view values");

	testNames.forEach(function(testName) {
		var testId = slugify(testName),
				test = tests[testId],
				testData = bed.tests[testId].data;

		y.domain([0, d3.max(testData, function(d) { return d.value; })]);

		axes.append("g")
			.attr("class", "axis y-axis "+testId)
			.call(yAxis);


		axes.append("text")
			.attr("class", "axis-label y-axis-label "+testId)
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x",-height/2)
      .attr("dy", "-4em")
      .style("text-anchor", "middle")
	    .text(test.unitExt);

		graph.addLine(bed, testName);
		graph.addLine(bed, testName, true);
	});

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", width)
			.attr("height", height+yOffset)
			.attr("transform", "translate(0,-"+yOffset+")");

	svg.call(zoom);
	zoom.scaleTo(svg, 3);
}

Bed.prototype.buildBed = function(lastBed) {
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

	var bedGraph = graphWrap.append("div")
			.attr("class", "bed-graph col col-12 col-md-9");

	var bedFilters = graphWrap.append("div")
			.attr("class", "bed-filters col col-12 col-md-3");

	var bedInfo = bedsSection.append("div")
			.attr("class", "bed-info row");

	bedInfo.append("div")
			.attr("class", "col col-12")
		.append("h3")
			.attr("class", "recent-title")
			.text("Recent test data");

	bed.container = bedsSection;
	bed.graph = new Graph(bedId);
	if(bedId == 1) {
		bed.table = new Table(bedId);
	}

	testNames.forEach(function(testName, i) {
		var testId = slugify(testName),
				testData = bed.tests[testId],
				lastEntry = testData.data[testData.data.length-1],
				lastValue = lastEntry.value,
				lastDate = lastEntry.date;

		bedGraph
			.append("div")
				.attr("class", "label bed-label "+testId)
				.attr("data-test", testId)
			.append("span")
				.text(testName);

		var filter = bedFilters
			.append("div")
				.attr("class", "button filter-button active color "+testId)
				.attr("data-test", testId)
		filter
			.append("span")
				.text(testName);

		
		var testInfo = bedInfo
			.append("div")
				.attr("class", "col-12 col-md-6 col-xl-4 test-info "+testId)
				.attr("data-test", testId)
			.append("div")
				.attr("class", "test-info-inner color");

		testInfo
			.append("h3")
				.attr("class", "color")
				.text(testName);

		var formatTime = d3.timeFormat("%B %d, %Y");

		testInfo
			.append("div")
				.attr("class", "value")
				.text(lastValue)
			.append("span")
				.attr("class", "unit")
				.text(tests[testId].unit);

		testInfo
			.append("div")
			.attr("class", "date note")
			.text("Tested on "+formatTime(lastDate));


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
				label = bedGraph.select(".label."+testId);
		var mouse = d3.mouse(line),
				x = mouse[0],
				y = mouse[1],
				left = d3.event.pageX - bedGraph.node().getBoundingClientRect().x + 15,
				top = d3.event.pageY - bedGraph.node().getBoundingClientRect().y - window.scrollY;

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


	bedFilters.append("div")
		.attr("class", "note filter-note")
		.text("Toggle the buttons above to hide or show test results on the graph.");

	var bedIcon = map.selectAll("#beds > g#bed-"+bedId);
	var bedName = d3.selectAll("#beds-names .bed-name[data-id=\""+bedId+"\"]");
	setTimeout(function() {
		bedIcon.classed("show", true);
		bedName.classed("show", true);
		if(lastBed) {
			d3.select("#beds-nav").classed("done", true);
		}
	}, bedId*Math.floor((Math.random() * 100) + 1));
	// map.classed("show", true);
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
		});
		handleAverageData(testName);
	});

	Object.keys(beds).forEach(function(bedId, i) {
		var bed = beds[parseInt(bedId)];
		bed.buildBed(i == Object.keys(beds).length-1);
	});
}

function handleTestInfoData(sheetData) {
	var testData = sheetData.result.values;
	var bedFilters = d3.select("#tests-info");
	testData.shift();
	testData.forEach(function(row, i) {
		var testName = row[0],
				testId = slugify(testName);

		tests[testId] = {
			name: testName,
			id: testId,
			unit: row[1],
			unitExt: row[2],
			about: row[3]
		};

		bedFilters.append("div")
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