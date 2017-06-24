var session = null;
var toggleRandomDataSendButton = null;

$(document).ready(function()
{
   updateStatusline("Not connected.");

   setupDemo();

   connect();
});

function connect() {
    var wsuri;
   if (document.location.origin == "file://") {
      wsuri = "ws://127.0.0.1:8080/ws";

   } else {
      wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
                  document.location.host + "/ws";
   }

   var httpUri;

   if (document.location.origin == "file://") {
      httpUri = "http://127.0.0.1:8080/lp";

   } else {
      httpUri = (document.location.protocol === "http:" ? "http:" : "https:") + "//" +
                  document.location.host + "/lp";
   }


   // Websocket
   //
    var connection = new autobahn.Connection({url: 'ws://127.0.0.1:8080/ws', realm: 'realm1'});
      connection.onopen = function (sess, details) {

      session = sess;

      if (details.x_cb_node_id) {
         updateStatusline("Connected to node <strong>" + details.x_cb_node_id + "</strong> at " + wsuri);
      } else {
         updateStatusline("Connected to " + wsuri);
      }

      /** define session prefixes ***/
      session.prefix("daimler", "daimler.dashboard");

      /** subscribe to events ***/
      session.subscribe("daimler:hi", onEqTr);
      session.subscribe("daimler:vital", onEqRbp);
      session.subscribe("daimler:accident", onEqUbp);
      session.subscribe("daimler:asp-by_region", onEqAbr);
      session.subscribe("daimler:driver", onEqRbr);
   };


   connection.onclose = function(reason, details) {
      sess = null;
      console.log("connection closed ", reason, details);
   
       if (details.will_retry) {
         updateStatusline("Trying to reconnect in " + parseInt(details.retry_delay) + " s.");
      } else {
         updateStatusline("Disconnected");   
      }
   }

   connection.open();
}


function updateStatusline(status) {
   $(".statusline").html(status);
};


function setupDemo() {

   // HI

   var i = 1;

   $( "#eq_tr > span" ).each(function() {
      // read initial values from markup and remove that
      var value = parseInt( $( this ).text(), 10 );
      var k = i;

      $( this ).empty().slider({
         value: value,
         range: "min",
         animate: true,
         orientation: "vertical",

         slide: function(event, ui) {
            session.publish("daimler:hi", [], { idx: k, val: ui.value });
         }
      });
      i += 1;
   });


   // Revenue by Product Sliders

   var n = 1;

   $( "#eq_rbp > span" ).each(function() {
      // read initial values from markup and remove that
      var value = parseInt( $( this ).text(), 10 );
      var k = n;

      $( this ).empty().slider({
         value: value,
         range: "min",
         animate: true,
         orientation: "vertical",

         slide: function(event, ui) {
            session.publish("daimler:vital", [], { idx: k, val: ui.value });
         }
      });
      n += 1;
   });

   var s = 1;

   $("#eq_ubp > span").each(function() {
      var value = parseInt($(this).text(), 10);
      var k = s;

      $(this).empty().slider({
         value: value,
         range: "min",
         animate: true,
         orientation: "vertical",

         slide: function(event, ui) {
            session.publish("daimler:driver", [], { idx: k, val: ui.value });
         }
      });
      s += 1;
   });


   // ASP by Region Sliders

   var t = 1;

   $("#eq_abr > span").each(function() {
      var value = parseInt($(this).text(), 10);
      var k = t;

      $(this).empty().slider({
         value: value,
         range: "min",
         animate: true,
         orientation: "vertical",

         slide: function(event, ui) {
            session.publish("daimler:mood", [], { idx: k, val: ui.value });
         }
      });
      t += 1;
   });


   var u = 1;

   $("#eq_rbr > span").each(function() {
      var value = parseInt($(this).text(), 10);
      var k = u;

      $(this).empty().slider({
         value: value,
         range: "min",
         animate: true,
         orientation: "vertical",

         slide: function(event, ui) {
            session.publish("daimler:accident", [], { idx: k, val: ui.value });
         }
      });
      u += 1;
   });

   $("#helpButton").click(function() { $(".info_bar").toggle() });

   toggleRandomDataSendButton =  document.getElementById("toggleRandomDataSend");
   toggleRandomDataSendButton.addEventListener("click", toggleRandomDataSend);
}

function send_activity() {

   var data = {};

   data.product = document.getElementById("event_select").value;
   data.units = document.getElementById("wichtigkeit").value;

   session.publish("daimler:event", [], data);
}

function switch_dashboard(number) {
   session.publish("daimler:switch-dashboard", [number]);
}

var randomDataSend = false;
function toggleRandomDataSend () {
   randomDataSend = !randomDataSend;

   if (randomDataSend) {
      sendRandomData();
      toggleRandomDataSendButton.innerHTML = "Stop";
   } else {
      toggleRandomDataSendButton.innerHTML = "Start";
   } 
}

var products = ["Schlafen", "Bewegen", "Langsamer Fahren"];
var regions = ["North", "East", "South", "West"];

function sendRandomData () {
   if (randomDataSend) {
      var dataCategories = ["hi", "vital", "driver", "mood", "accident", "event"];
      var currentCategory = dataCategories[Math.floor(Math.random() * dataCategories.length)];

      var event = {};
      switch (currentCategory) {
      
         case "hi":
            var revenue = Math.floor(Math.random() * 100);
            event = { idx: 1, val: revenue};
            break;
      
         case "vital":
         case "driver":
            var product = Math.floor(Math.random() * 4);
            var value = Math.floor(Math.random() * 100);
            event = { idx: product, val: value };
            break;
      
         case "mood":
         case "accident":
            var region = Math.floor(Math.random() * 5);
            var value = Math.floor(Math.random() * 100);
            event = { idx: region, val: value };
            break;
      
         case "event":
            var product = products[Math.floor(Math.random() * 4)];
            var region = regions[Math.floor(Math.random() * 5)];
            var units = Math.floor(Math.random() * 100);
            var revenue = Math.floor(Math.random() * 50) * units;
            event = {product: product, region: region, units: units, revenue: revenue};
            break;
      
         default:
            console.log("unknown event category", currentCategory);
            break;
      }

      session.publish("daimler:" + currentCategory, [], event);

      var maxInterval = 300;
      var minInterval = 1;
      var nextCallInterval = Math.floor(Math.random() * (maxInterval - minInterval) + minInterval);
      setTimeout(sendRandomData, nextCallInterval);
   }
   
}



function onEqTr(topicUri, event) {

   $("#eq_tr span:nth-child(" + event.idx + ")").slider({
      value: event.val
   });
}

function onEqRbp(topicUri, event) {

   $("#eq_rbp span:nth-child(" + event.idx + ")").slider({
      value: event.val
   });
}

function onEqUbp(topicUri, event) {

   $("#eq_ubp span:nth-child(" + event.idx + ")").slider({
      value: event.val
   });
}

function onEqAbr(topicUri, event) {

   $("#eq_abr span:nth-child(" + event.idx + ")").slider({
      value: event.val
   });
}

function onEqRbr(topicUri, event) {

   $("#eq_rbr span:nth-child(" + event.idx + ")").slider({
      value: event.val
   });
}
