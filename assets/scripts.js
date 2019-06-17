var CLIENT_ID = "493611924506-dcpheb2km05mqreg1bq4dajp9uunco9p.apps.googleusercontent.com";
var API_KEY = "AIzaSyA8_appx3mfM4EBauUgqY4MUvlf1_mkte8";
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var SPREADSHEET_ID = "1RjOpiMjIEZ2_NCrAMBqCSFj-3sYQu8NHhI1FsLYStjA";

var body = document.body;

var testNames = ['MicroBIOMETER', 'Brix', 'pH', 'Temperature', 'Moisture', 'Nodules', 'Rhizosheaths'],
		tests = {},
		beds = {},
		averages = {};



function Bed(id) {
	this.id = id;
	this.graphs = {};
	this.tests = {};
	beds[id] = this;
}


Bed.prototype.createGraph = function(testName) {
	var bed = this,
			id = bed.id,
			testSlug = slugify(testName),
			graphData = bed.tests[testName],
			testData = tests[testName];

	bed.graphs[testName] = {};

	var bedsSection = d3.select("section#sect-"+id);
	if(!bedsSection.size()) {
		bedsSection = d3.select("#graphs-list")
			.append("section")
				.attr("class", "bed")
				.attr("id", "sect-"+id);
		bedsSection.append("h2")
			.attr("class", "section-title")
			.text(id);
	}

	var graphsWrap = bedsSection.select(".graphs-wrapper");
	if(!graphsWrap.size()) {
		graphsWrap = bedsSection
			.append("div")
			.attr("class", "graphs-wrapper");
	}

	var test = graphsWrap.append("div")
			.attr("class", "test row "+testSlug);

	var testGraph = test.append("div")
		.attr("class", "test-graph col col-12 col-md-6");

	var testInfo = test.append("div")
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
		.attr("class", "graph-wrapper");

	var wrapperNode = wrapper.node();
	bed.graphs[testName].wrapper = wrapperNode;

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
	bed.graphs[testName].svg = svg;

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

	bedsSection.classed("show", true);

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


function averageData(testName) {
	var test = tests[testName].data;
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
	var avgBed = new Bed(testName);
	avgBed.id = graphId;
	avgBed.tests[testName] = orderedValues;
	// avgBed.createGraph(testName);
	beds[graphId] = avgBed;
}

function handleData(testName, testData) {
	var parseDate = d3.timeParse("%b %Y");
	var headers = testData.shift();
	headers.shift();

	if(!tests[testName]) {
		tests[testName] = {};
	}
	if(!tests[testName].data) {
		tests[testName].data = [];
	}
	testData.forEach(function(bedRowData, i) {
		var graphId = bedRowData.shift();
		if(!beds[graphId]) {
			beds[graphId] = new Bed(graphId);	
		}
		var bed = beds[graphId];
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
			tests[testName].data.push(entry)
		});
		bed.tests[testName] = entries;
	});
}

function handleTestInfo(sheetData) {
	var testInfo = d3.select("#tests-info");
	sheetData.shift();
	sheetData.forEach(function(row, i) {
		var name = row[0];
		if(!tests[name]) {
			tests[name] = {};
		}
		tests[name].name = name;
		tests[name].unit = row[1];
		tests[name].about = row[2];
		testInfo.append("div")
				.attr("class", "test-block "+slugify(name))
			.append("h3")
				.attr("class", "test-title")
				.text(name);
	});
}

function getData(sheetName) {
	// var rangePart = "!A1:ZZ1000";
	// var range = "";
	// testNames.forEach(function(testName) {
		// range += "'"+testName+"'";
		// range.push(rangePart);
	// });
	var params = {
		spreadsheetId: SPREADSHEET_ID,
		range: "'"+sheetName+"'",
		majorDimension: "ROWS"
	};
	var request = gapi.client.sheets.spreadsheets.values.get(params);
	request.then(function(response) {
		var sheetData = response.result.values;
		if(sheetName == "Tests") {
			handleTestInfo(sheetData);
		} else {
			handleData(sheetName, sheetData);
			averageData(sheetName, sheetData);
		}
	}, function(reason) {
		console.error("error: " + reason.result.error.message);
	});
}

function initMap() {
	// for(var i = 0; i < 2; i++) {
		// d3.xml("/assets/map"+(i+1)+".svg", function(data) {
	d3.xml("/assets/map.svg", function(data) {
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
					label = "Bed No. "+bedNo;

			var label = mapWrap
				.append("div")
					.attr("data-bed-id", bedId)
					.attr("class", "bed-label")
				.append("span")
					.text(label);
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
					bedId = hexagon.id,
					bedNo = bedId.replace("bed-",""),
					bed = beds[bedNo];

			var bedsSection = d3.select("section#sect-"+bedNo);

			if(bedsSection.size()) {
				bedsSection.classed("show", true)
			} else {
				testNames.forEach(function(testName) {
					bed.createGraph(testName);
				});
				bedsSection = d3.select("section#sect-"+bedNo);
			}

			d3.selectAll("section:not(#sect-"+bedNo+")")
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
		getData("Tests");
		testNames.forEach(function(testName, i) {
			getData(testName);
		});
	});
}

function handleClientLoad() {
	gapi.load("client:auth2", initClient);
}