var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var testNames = ['Microbiometer', 'Brix', 'Ph', 'Temperature', 'Moisture', 'Nodules', 'Rhizosheaths'],
		data = {},
		beds = {};


function Bed(number) {
	this.number = number;
	this.tests = {};
	this.graph = {};
}


Bed.prototype.createTestGraph = function(testName) {
	var bed = this,
			number = bed.number,
			graphData = bed.tests[testName];

	var bedSection = d3.select("section#bed-"+number);
	if(!bedSection.size()) {
		bedSection = d3.select("main")
			.append("section")
				.attr("class", "bed")
				.attr("id", "bed-"+number);
		bedSection.append("h2")
			.attr("class", "bed-title")
			.text("Bed No. "+number);
	}

	var graphGrid = bedSection.select(".graph-grid");
	if(!graphGrid.size()) {
		graphGrid = bedSection
			.append("div")
			.attr("class", "graph-grid row");
	}

	var col = graphGrid.append("div")
		.attr("class", "graph-col col-12 col-sm-6");
	col.append("h3")
		.attr("class", "graph-title")
		.text(testName);
	var wrapper = col.append("div")
		.attr("class", "graph-wrapper");

	var wrapperNode = wrapper.node();
	bed.graph.wrapper = wrapperNode;

	var margin = {top: 20, right: 20, bottom: 30, left: 40};
	var wrapperWidth = wrapperNode.clientWidth,
			wrapperHeight = wrapperNode.clientHeight;
	var width = wrapperWidth - margin.left - margin.right,
			height = wrapperHeight - margin.top - margin.bottom;
	var svg = wrapper.append("svg")
		.attr('id', number+'-'+testName)
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
			.extent([[0, 0], [width, height]]);
			// .on("zoom", function() {
				// var t = d3.event.transform,
				// 		xt = t.rescaleX(x);
				// g.select(".area").attr("d", area.x(function(d) {
				// 	return xt(d.date);
				// }));
				// g.select(".axis--x").call(xAxis.scale(xt));
			// });

	var area = d3.area()
			// .curve(d3.curveMonotoneX)
			.x(function(d) { return x(d.date); })
			.y0(height)
			.y1(function(d) { return y(d.value); });

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", width)
			.attr("height", height);
	bed.graph.svg = svg;

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

Bed.prototype.addTestData = function(testName, entries) {
	this.tests[testName] = entries;
	this.createTestGraph(testName);
}

function handleData(testName, testData) {
	var parseDate = d3.timeParse("%b %Y");
	var headers = testData.shift();
	headers.shift();
	testData.forEach(function(bedRowData, i) {
		var bedNum = bedRowData.shift();
		if(!beds[bedNum]) {
			beds[bedNum] = new Bed(bedNum);	
		}
		var bed = beds[bedNum];
		var entries = [];
		bedRowData.forEach(function(testValue, j) {
			var date = new Date(headers[j]);
			var value = testValue ? parseInt(testValue) : 0;
			var entry = {
				date: date,
				value: value
			};
			entries.push(entry);
		});
		bed.tests[testName] = entries;
		bed.createTestGraph(testName);
	});
}

function makeApiCall(testName) {
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
	}, function(reason) {
		console.error("error: " + reason.result.error.message);
	});
}

function loopTests() {
	testNames.forEach(function(testName, i) {
		makeApiCall(testName);
	});
}


function initClient() {
	gapi.client.init({
		"apiKey": API_KEY,
		"clientId": CLIENT_ID,
		"scope": SCOPE,
		"discoveryDocs": ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
	}).then(function() {
		loopTests();
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