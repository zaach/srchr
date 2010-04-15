// srchr challenge submission by @zii

(function (global, $, undefined) {

var queryStore;
$(document).ready(function () {
    $("#sources").buttonset();
	$("button").button();
	$("#search_results").tabs();
	$("#search_results").tabs( { panelTemplate: '<div>loading...</div>' } );
	
	$("form").submit(function () {
        query();
        return false;
	});

	$("#search_submit").click(function () {
        query();
        return false;
	});
	
	$(".close").live('click', function () {
	    queryView.remove($(this).parent().data('query'));
	    queryView.show();
	});
	
	$(".term_link").live('click', function () {
        var q = $(this).parent().data('query');
        yql(q, queryView.get(q));
	});
	
	// load saved queries
    queryStore = window.localStorage;
    var qs = queryStore.getItem('queries');
    if (qs) {
        queryView.seed(JSON.parse(qs));
        queryView.show();
    }
});

function query () {
    var q = $("#search").val();
    var sources = $("input:checked").map(function () {return this.id.replace("enable_", ""); }).get();
    queryView.put(q, sources);
    yql(q, sources);
}

function yql (q, sources) {
    $("#search_results > div, #tabs > li").remove(); // clear previous results
    $(sources).each(function (i, key) {
        var source = dataSources[key];
        $("#search_results").tabs("add", "#result_tab_"+key, source.name);
    	$.yql(source.yqs, {query: q},
            function (data) {
                $("#result_tab_"+key).html(source.render(data.query.results || []));
            }
        );
    });
}

var queryView = {
    _queries: {},
    seed: function recordQuery (seed) {
        this._queries = seed;
    },
    get: function recordQuery (q) {
        return this._queries[q];
    },
    put: function (q, sources) {
        this.record(q, sources);
        this.show();
    },
    remove: function (q) {
        delete this._queries[q];
        queryStore.setItem('queries', JSON.stringify(this._queries));
    },
    record: function recordQuery (q, sources) {
        this._queries[q] = sources;
        queryStore.setItem('queries', JSON.stringify(this._queries));
    },
    show: function showHistory () {
        $("#search_terms").html('');
        $.each(this._queries, function (key, value) {
            var icons = $(value).map(function (i, ico) { return ' <img src="css/'+ico+'.png" />'; }).get();
            var item = $("<li/>", {className: 'term '}).append(
                            $("<a/>", {href: "#", className:'term_link', html: key + icons.join(' ')})
                        ).append(
                            $('<span class="close"></span>')
                        ).data('query', key);
            $("#search_terms").append(item);
        });
    }
};

/* Data source configurations */

var flickrSource = {
    name: "Flickr",
    templ: '',
    yqs: "SELECT urls.url,title,owner.username,farm,id,secret,server FROM flickr.photos.info WHERE photo_id in (SELECT id FROM flickr.photos.search WHERE text=#{query})",
    translate: function (data) {
        data.photo = $(data.photo).each(function () { this.url = this.urls.url.content; }).get();
        return data;
    },
    render: function (results) {
        this.templ = this.templ || $("#flickr_templ").html();
        return $.mustache(this.templ, this.translate(results));
    }
};

var yahooSource = {
    name: "Yahoo!",
    templ: '',
    yqs: "SELECT title,url,abstract FROM search.web WHERE query=#{query}",
    render: function (results) {
        this.templ = this.templ || $("#yahoo_templ").html();
        return $.mustache(this.templ, results);
    }
};

var upcomingSource = {
    name: "Upcoming",
    templ: '',
    yqs: "select url,name,description from upcoming.events where tags=#{query}",
    render: function (results) {
        this.templ = this.templ || $("#upcoming_templ").html();
        return $.mustache(this.templ, results);
    }
};

var dataSources = {
    flickr: flickrSource,
    yahoo: yahooSource,
    upcoming: upcomingSource
};

})(window, jQuery);