var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var body = document.body;

var testNames = ['MicroBIOMETER', 'Brix', 'pH', 'Temperature', 'Moisture', 'Nodules', 'Rhizosheaths'],
		tests = {},
		beds = {},
		graphs = {},
		averages = {};


function Bed(bedId) {
	this.id = bedId;
	this.graphs = {};
	beds[bedId] = this;
}

function Graph(testName) {
	var testId = slugify(testName);
	this.id = testId;
	this.name = testName;
	graphs[testId] = this;
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
					.attr("data-bed-id", bedId)
					.attr("class", "bed-label")
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
					bed.graphs[testId].createGraph();
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
					label = mapWrap.select("[data-bed-id='"+bedId+"']");
			label.classed("show", true);
			// hexagon.style('fill', 'red');
		});

		hexagons.on("mousemove", function(e) {
			var mapWrap = d3.select("#beds-map"),
					hexagon = this,
					bedId = hexagon.id,
					label = mapWrap.select("[data-bed-id='"+bedId+"']");
			
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
					label = mapWrap.select("[data-bed-id='"+bedId+"']");
			
			label.classed("show", false);
		});
	});
	// }
}

Bed.prototype.buildBed = function() {
	var bed = this,
			bedId = bed.id;

	var bedsSection = d3.select("#graphs-list")
		.append("section")
			.attr("class", "bed")
			.attr("id", "sect-"+bedId);			
	bedsSection.append("h2")
		.attr("class", "section-title")
		.text(bed.id);

	var graphsWrap = bedsSection
		.append("div")
		.attr("class", "graphs-wrapper");

	testNames.forEach(function(testName) {
		var testId = slugify(testName),
				testData = tests[testId],
				test = bed.graphs[testId];

		var testRow = graphsWrap.append("div")
				.attr("class", "test row "+testId);

		var testGraph = testRow.append("div")
			.attr("class", "test-graph col col-12 col-md-6");

		var testInfo = testRow.append("div")
			.attr("class", "test-info col col-12 col-md-6");

		testInfo.append("h3")
			.attr("class", "test-name")
			.text(testData.name);

		testInfo.append("h4")
			.attr("class", "test-unit")
			.text(testData.unit);

		testInfo.append("div")
			.attr("class", "test-about")
			.text(testData.about);
		
		var wrapper = testGraph.append("div")
				.attr("class", "graph-wrapper")
				// .append(test.graph.node());

		test.graph.createGraph(bed, wrapper);

	});
}


Graph.prototype.createGraph = function(bed, wrapper) {
	var graph = this,
			testId = graph.id,
			testName = graph.name,
			graphData = bed.graphs[testId].data,
			testData = tests[testId];

	var margin = {top: 20, right: 20, bottom: 30, left: 40};
	// var wrapperWidth = wrapperNode.clientWidth,
	// 		wrapperHeight = wrapperNode.clientHeight;

	var wrapperWidth = 669;
	var wrapperHeight = 535;


	var width = wrapperWidth - margin.left - margin.right,
			height = wrapperHeight - margin.top - margin.bottom;
			
	var svg = wrapper.append("svg")
		.attr('id', bed.id+'-'+testId)
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

	graph.svg = svg;

	// var buttonsWrapper = testGraph.append("div")
	// 	.attr("class", "buttons-wrapper");

	// var averageToggle = buttonsWrapper.append("div")
	// 	.attr("class", "button toggle average-toggle")
	// 	.text("Compare to average");

	// var downloadButton = buttonsWrapper.append("div")
	// 	.attr('href', '#')
	// 	.attr("class", "button toggle download-data")
	// 	.text("Download data");
}

Graph.prototype.addGraph = function() {

	bedsSection.classed("show", true);
}


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
	// var graph = new Graph(testName, 'avg');
	// graph.createGraph();
}

function handleData(resultData) {
	testNames.forEach(function(testName, i) {
		var testData = resultData[i].result.values,
				testId = slugify(testName);

		var parseDate = d3.timeParse("%b %Y");
		var headers = testData.shift();
		headers.shift();
		testData.forEach(function(bedRowData, i) {
			var bedId = bedRowData.shift();
			var bed = beds[bedId];
			if(!bed) {
				bed = new Bed(bedId);
				beds[bedId] = bed;
			}
			if(bed.graphs) {
				bed.graphs[testId] = {
					data: []
				};
			}
			var graph = new Graph(testName);
			bed.graphs[testId].graph = graph;
			var test = bed.graphs[testId];
			bedRowData.forEach(function(testValue, j) {
				var date = new Date(headers[j]);
				var value = testValue ? parseInt(testValue) : 0;
				if(!value) {return}
				var entry = {
					date: date,
					value: value
				};
				test.data.push(entry);
			});

			if(Object.keys(beds[bedId].graphs).length == 7) {
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