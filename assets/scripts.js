var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var testNames = ['Microbiometer', 'Brix', 'Ph', 'Temperature', 'Moisture', 'Nodules', 'Rhizosheaths'],
		data = {},
		tests = {},
		graphs = {},
		averages = {};



function Graph(id) {
	this.id = id;
	this.tests = {};
	this.graph = {};
	graphs[id] = this;
}


Graph.prototype.createTestGraph = function(testName) {
	var graph = this,
			id = graph.id,
			testSlug = slugify(testName),
			graphData = graph.tests[testName];

	var graphSection = d3.select("section#graph-"+id);
	if(!graphSection.size()) {
		graphSection = d3.select("main")
			.append("section")
				.attr("class", "graph")
				.attr("id", "graph-"+id);
		graphSection.append("h2")
			.attr("class", "graph-title")
			.text(id);
	}

	var graphGrid = graphSection.select(".graph-grid");
	if(!graphGrid.size()) {
		graphGrid = graphSection
			.append("div")
			.attr("class", "graph-grid row");
	}

	var col = graphGrid.append("div")
		.attr("class", "graph col col-12 col-sm-6 "+testSlug);
	col.append("h3")
		.attr("class", "graph-title")
		.text(testName);
	var wrapper = col.append("div")
		.attr("class", "graph-wrapper");

	var wrapperNode = wrapper.node();
	graph.graph.wrapper = wrapperNode;

	var margin = {top: 20, right: 20, bottom: 30, left: 40};
	var wrapperWidth = wrapperNode.clientWidth,
			wrapperHeight = wrapperNode.clientHeight;
	var width = wrapperWidth - margin.left - margin.right,
			height = wrapperHeight - margin.top - margin.bottom;

	var svg = wrapper.append("svg")
		.attr('id', id+'-'+testName)
		.attr('width', width)
		.attr('height', height)
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 "+wrapperWidth+" "+wrapperHeight );

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);

	var xAxis = d3.axisBottom(x),
			yAxis = d3.axisLeft(y);

	var zoom = d3.zoom()
			.scaleExtent([1, 32])
			.translateExtent([[0, 0], [width, height]])
			.extent([[0, 0], [width, height]])
			.on("zoom", function() {
				var t = d3.event.transform,
						xt = t.rescaleX(x);
				g.select(".area").attr("d", area.x(function(d) {
					return xt(d.date);
				}));
				g.select(".axis--x").call(xAxis.scale(xt));
			});

	var area = d3.area()
			// .curve(d3.curveCatmullRom)
			.curve(d3.curveLinear)
			// .curve(d3.curveStepBefore)
			// .curve(d3.curveStepAfter)
			// .curve(d3.curveStep)
			.x(function(d) { return x(d.date); })
			.y0(height)
			.y1(function(d) { return y(d.value); });

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", width)
			.attr("height", height);
	graph.graph.svg = svg;

	var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	x.domain(d3.extent(graphData, function(d) { return d.date; }));
	y.domain([0, d3.max(graphData, function(d) { return d.value; })]);

	g.append("path")
			.datum(graphData)
			.attr("class", "area")
			.attr("d", area);

	g.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

	g.append("g")
			.attr("class", "axis axis--y")
			.call(yAxis);

	svg.call(zoom);

	var buttonsWrapper = col.append("div")
		.attr("class", "buttons-wrapper");

	var averageToggle = buttonsWrapper.append("div")
		.attr("class", "button toggle average-toggle")
		.text("Compare to average");

	var downloadButton = buttonsWrapper.append("div")
		.attr('href', '#')
		.attr("class", "button toggle download-data")
		.text("Download data");

	// window.addEventListener("resize", function() {
	// 	var svg = bed.graph.svg,
	// 			wrapper = bed.graph.wrapper,
	// 			wrapperWidth = wrapper.clientWidth,
	// 			wrapperHeight = wrapper.clientHeight,
	// 			margin = {top: 20, right: 20, bottom: 30, left: 40};

	// 	var width = wrapperWidth - margin.left - margin.right,
	// 			height = wrapperHeight - margin.top - margin.bottom;
	// 	// svg.attr("width", width)
	// 		// .attr("height", height)
	// 		// .attr("viewBox", "0 0 "+wrapperWidth+" "+wrapperHeight )
	// 		// .select(".axis--x")
	// 			// .attr("transform", "translate(0," + height + ")");
	// });


}

Graph.prototype.addTestData = function(testName, entries) {
	this.tests[testName] = entries;
	this.createTestGraph(testName);
}

function averageData(testName) {
	var test = tests[testName];
	var dates = {};
	var sum = 0;
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
	var graphId = 'avg';
	var avgGraph = new Graph(testName);
	avgGraph.id = graphId;
	avgGraph.tests[testName] = orderedValues;
	avgGraph.createTestGraph(testName);
	graphs[graphId] = avgGraph;
	// avgGraph
	// avgGraph.addTestData('avg');
	// addTestData
}

function handleData(testName, testData) {
	var parseDate = d3.timeParse("%b %Y");
	var headers = testData.shift();
	headers.shift();

	if(!tests[testName]) {
		tests[testName] = [];
	}
	testData.forEach(function(bedRowData, i) {
		var graphId = bedRowData.shift();
		if(!graphs[graphId]) {
			graphs[graphId] = new Graph(graphId);	
		}
		var graph = graphs[graphId];
		var entries = [];
		bedRowData.forEach(function(testValue, j) {
			var date = new Date(headers[j]);
			var value = testValue ? parseInt(testValue) : 0;
			if(!value) {return}
			var entry = {
				date: date,
				value: value
			};
			entries.push(entry);
			tests[testName].push(entry)
		});
		graph.tests[testName] = entries;
		graph.createTestGraph(testName);
	});
}

function getTestData(testName) {
	var range = testName+"!A1:ZZ1000";
	var params = {
		spreadsheetId: SPREADSHEET_ID,
		range: range,
		majorDimension: "ROWS"
	};
	var request = gapi.client.sheets.spreadsheets.values.get(params);
	request.then(function(response) {
		var testData = response.result.values;
		handleData(testName, testData);
		averageData(testName, testData);
		// if(Object.keys(tests).length === testNames.length) {
		// 	averageData(testName, testData);
		// }
	}, function(reason) {
		console.error("error: " + reason.result.error.message);
	});
}

function initClient() {
	gapi.client.init({
		"apiKey": API_KEY,
		"clientId": CLIENT_ID,
		"scope": SCOPE,
		"discoveryDocs": ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
	}).then(function() {
		testNames.forEach(function(testName, i) {
			getTestData(testName);
		})
	});
}

function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}

function slugify(string) {
	return string
		.toLowerCase()
		.replace(/ /g,"-")
		.replace(/[^\w-]+/g,"-");
}