/*************************************
//
// donations app - D3
//
**************************************/



// D3 stuff
var liveGraphApp = function() {

  /**
   * Return suitable scale from graph(bar) height + max value
   */
  function getScale(height, max) {
    return d3.scale.linear()
      .domain([0, max])
      .range([0, height]);
  }

  /**
   * Create a chart
   */
  function BarChart(container, setup) {

    // Create main element (div), and inside header and svg for chart
    var div = container.append('div').attr('class', setup.class || '');
    var header = div.append('h2').text(setup.title);
    var chart = div.append('svg').attr('class', 'chart');

    // From setup, get config and data
    var data = setup.series || [];
    var config = setup.config || {};

    var maxY = config.maxVal || 200;
    var height = config.height || 200;
    var width = config.width || 200;
    var n = data.length || 2;
    var barBorder = config.spacing || 4;
    var barWidth = width / n;
    var barHeight = height - 40;

    console.log("setting up chart ... ", setup);
    var y = getScale(barHeight, maxY);


    // Set size attribs on scale
    chart
      .attr("width", barWidth * n)
      .attr("height", height);

    // Creating a "selection" of all bars,
    // already applying a transformation of origin
    var bar = chart
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
        .attr("transform", function(d, i) {
          return "translate(" + i * barWidth + ", 0)";
        });

    // For the bar selection (i.e. for every bar),
    // append a rect inside
    bar.append("rect")
        .attr("width", barWidth - barBorder)
        .attr("y", barHeight)
        .attr("height", 1)
        ;

    if (! (config.notext || false)) {
      // .. and append text (numeric value)
      bar.append("text")
          .attr("x", barWidth - barBorder - 10)
          .attr("y", barHeight - 20)
          .attr("dy", ".35em")
          .attr('class', 'num')
          .text(function(d) { return d; });

      // .. and append text (project titles)
      if(setup.projects) {
        bar.append("text")
           .data(setup.projects)
           .attr("x", 10)
           .attr("y", barHeight + 20)
           .attr("dy", ".35em")
           .attr('class', 'title')
           .text(function(d) { return d.title; });
      }
    }

    if(setup.projects) {
      // Set css classes for session and project to bars
      chart.selectAll("rect")
            .data(setup.projects)
            .attr('class', function(d) { return 'bar-session-' + d.sessionId + ' bar-id-' + d.id; });
    }

    /**
     * Update a chart with new data
     */
    function updateGraph(chart, newdata) {
      // Highest value
      var maxvalue = d3.max(newdata);
      // Index with the hightest value
      var maxindex = newdata.indexOf(maxvalue);

      // Check for rescaling, if maxvalue to high or too low
      if(maxvalue > maxY) {
        maxY = maxvalue * 1.5;
        y = getScale(barHeight, maxY);
      } else if (maxvalue < 0.4*maxY) {
         maxY = maxvalue * 0.6;
         y = getScale(barHeight, maxY);
      }

      chart.selectAll("rect")
        .data(newdata)
        .classed("leader", function(d, i) { return i==maxindex; })
        .transition().duration(750).ease("bounce")
        .attr("y", function(d) { return barHeight - y(d); })
        .attr("height", y)
        ;

      chart.selectAll("text.num")
        .data(newdata)
        .text(function(d) { return d; })
        ;
    }

    // Once created, do an update
    updateGraph(chart, data);

    this.updateGraph = function(values) {
      updateGraph(chart, values);
    }
    this.chart = chart;
    return this;
  }


  // This will hold the list of charts
  var sessionCharts = {};
  var activeChart, activeId;
  var overviewChart;

  // Keep the last recieved status / data for each chart
  var chartStates = {};

  // These are two container elements to contain chart(s),
  // one for small charts, one for the main active chart
  var container = d3.select(".chartlist");
  var mainContainer = d3.select(".mainchart");

  //
  // These are default visual settings, for small charts
  //  and for the main chart
  //
  var barconfig = {
      width: 140,
      height: 100,
      maxVal: 200,
    };
  var barConfigLarge = {
      width: 500,
      height: 400,
      maxVal: 200,
      spacing:20
    };

  /**
   * Map from update struct to Chart constructor format
   */
  function mapChartConfig(cobj, layoutConfig, classtype) {
    return {
      title: cobj.title,
      class: [(cobj.class || ''), classtype, 'session-'+cobj.id].join(' '),
      config: layoutConfig,
      projects: cobj.projects,
      series: cobj.projects.map(function(p) { return p.value; })
    };
  }

  /**
   * From the full state-config, map to the overview chart (all projects
   * in one chart).
   */
  function mapOverviewChartConfig(allStates, layoutConfig, classtype) {
    var projects = Object.keys(allStates)
      .map(function(k) { return allStates[k]; })
      .map(function(obj) {
        return obj.projects.map(function(p) { return p; })
      })
      .reduce(function(l, item) { return l.concat(item) }, []),
    data = projects
      .map(function(p) { return p.value; });

    layoutConfig.notext = true;
    return {
      title: 'Overview',
      class: classtype,
      config: layoutConfig,
      series: data,
      projects: projects,
    }
  };

  /**
   * Helper that will set up the main chart from a configuration object
   */
  function createMainChart(cobj) {
    return new BarChart(mainContainer,
      mapChartConfig(cobj, barConfigLarge, 'large'));
  }

  /**
   * Make a specific chart (session id) active (become the large chart)
   */
  function setChartActive(id, configObj) {
    if (typeof(activeId)!=='undefined') {
      // re-enable small view of current active chart
      d3.select('.side.session-'+activeId).style('display', 'block');

      // remove current active chart
      // d3.select('.large.session-'+activeId).remove();
    }

    // simpley clear all large-charts:
    d3.selectAll('.large').remove();

    activeId = id;
    if(configObj) {
      activeChart = createMainChart(configObj);
    } else if (id in chartStates) {
      activeChart = createMainChart(chartStates[id]); // create from last state
    }

    // hide from side view
    d3.select('.side.session-'+activeId).style('display', 'none');
  }

  //
  // Fetch the initial setup from backend
  //
  d3.json("/setup", function(error, initialData) {
    if (error) { return alert(error); }

    // Loop over the settings, and create a chart for every
    // session-config
    initialData.forEach(function(cobj) {
      var chart = new BarChart(container,
        mapChartConfig(cobj, barconfig, 'side'));

      // Add it to the charts-dict for later retrieval (updates)
      sessionCharts[cobj.id] = chart;

      // Keep config
      chartStates[cobj.id] = cobj;
    });

    // Set first chart as active chart
    setChartActive(0, initialData[0]);

    // Set up overview chart
    overviewChart = new BarChart(container,
      mapOverviewChartConfig(chartStates, barconfig, 'overview'));

  });


  return {
    BarChart: BarChart,
    setChartActive: setChartActive,
    update: function(sessions) {
      console.log("Recieved update : ");
      console.log(sessions);
      sessions.forEach(function(cobj) {

        // Keep copy of state
        chartStates[cobj.id] = cobj;

        console.log(cobj);
        var flatValues = cobj.projects.map(function(p) { return p.value; });
        sessionCharts[cobj.id].updateGraph(flatValues);

        if(activeId == cobj.id) {
          // Also update big chart ..
          activeChart.updateGraph(flatValues);
        }
      });

      // Update overview
      overviewChart.updateGraph(mapOverviewChartConfig(chartStates, barconfig)
        .series);
    },
  };
};
