function rad2deg(angle) {
  return angle * 57.29577951308232;
}

function distance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295; // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p) / 2 +
    c(lat1 * p) * c(lat2 * p) *
    (1 - c((lon2 - lon1) * p)) / 2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function bearing(lat1, long1, lat2, long2) {
  var bearingradians = Math.atan2(Math.asin(long1 - long2) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(long1 - long2));
  var bearingdegrees = rad2deg(bearingradians);

  return bearingdegrees
}

let updateInterval = 10000; //10 seconds
var map;
var aircraft = {};
var makeMarker;
var airfield_markers;
var iconScale = 33;
var iconBase = 'icons/';
var icon_classes = {
  fighters: ["F-15C", "M-2000C", "FA-18C_hornet", "MiG-31", "MiG-21Bis", "J-11A", "F-5E-3", "Su-27"],
  attackers: ["Su-25T", "A-10C", "AJS37", "AV8BNA"],
  helos: ["UH-1H"],
  tankers: ["IL-78M", "KC-135", "KC130"],
  awacs: ["E-3A", "A-50"],
  cargo: ["IL-76MD", "C-130"]
};

var icon_files = {
  bluefighters: iconBase + "BLUEFIGHTER.png",
  blueattackers: iconBase + "BLUEATTACK.png",
  blueawacs: iconBase + "BLUEAWACS.png",
  bluehelos: iconBase + "BLUEHELO.png",
  bluetankers: iconBase + "BLUETANKER.png",
  bluecargo: iconBase + "BLUECARGO.png",
  blueunknown: iconBase + "BLUEUNKNOWN.png",
  redfighters: iconBase + "REDFIGHTER.png",
  redattackers: iconBase + "REDATTACK.png",
  redawacs: iconBase + "REDAWACS.png",
  redhelos: iconBase + "REDHELO.png",
  redtankers: iconBase + "REDTANKER.png",
  redcargo: iconBase + "REDCARGO.png",
  redunknown: iconBase + "REDUNKNOWN.png",
}

function getIcon(side, unit) {
  for (var icon_class in icon_classes) {
    if (icon_classes[icon_class].includes(unit.type)) {
      return icon_files[side + icon_class];
    }
  }
  return icon_files[side + "unknown"];
}

window.initMap = function(){
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 44.7988655,
      lng: 37.9752869
    },
    zoom: 10,
    mapTypeId: 'terrain',
    styles: [{
      //elementType: 'geometry', stylers: [{color: '#101000'}]
    }, {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{
        "visibility": "off"
      }]
    }, {
      "featureType": "administrative.localilty",
      "elementType": "labels",
      "stylers": [{
        "visibility": "off"
      }]
    }, {
      "featureType": "poi",
      "stylers": [{
        "visibility": "off"
      }]
    }, {
      "featureType": "road",
      "elementType": "labels",
      "stylers": [{
        "visibility": "off"
      }]
    }, {
      "featureType": "poi",
      "elementType": "labels",
      "stylers": [{
        "visibility": "off"
      }]
    }]
  });

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['circle']
    },
    markerOptions: {
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'
    },
    circleOptions: {
      fillColor: '#ff0000',
      fillOpacity: .3,
      strokeWeight: 5,
      clickable: true,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);

  neutralware = {
    url: 'icons/NEUTRALWARE.png',
    scaledSize: new google.maps.Size(iconScale, iconScale), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0) // anchor
  }

  blueware = {
    url: 'icons/BLUEWARE.png',
    scaledSize: new google.maps.Size(iconScale, iconScale), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0) // anchor
  }

  redware = {
    url: 'icons/REDWARE.png',
    scaledSize: new google.maps.Size(iconScale, iconScale), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0) // anchor
  }

  neutralap = {
    url: 'icons/NEUTRALAP.png',
    scaledSize: new google.maps.Size(iconScale - 10, iconScale - 10), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0), // anchor
  }

  blueap = {
    url: 'icons/BLUEAP.png',
    scaledSize: new google.maps.Size(iconScale - 10, iconScale - 10), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0), // anchor
  }

  redap = {
    url: 'icons/REDAP.png',
    scaledSize: new google.maps.Size(iconScale - 10, iconScale - 10), // scaled size
    origin: new google.maps.Point(0, 0), // origin
    anchor: new google.maps.Point(0, 0), // anchor
  }

  farp_markers = {
    "NW Warehouse": new google.maps.Marker({
      position: {
        lat: 45.20361111,
        lng: 38.07833333
      },
      icon: neutralware
    }),
    "SW Warehouse": new google.maps.Marker({
      position: {
        lat: 44.92833333,
        lng: 38.09000000
      },
      icon: neutralware
    }),
    "NE Warehouse": new google.maps.Marker({
      position: {
        lat: 45.16750000,
        lng: 38.92638889
      },
      icon: neutralware
    }),
    "SE Warehouse": new google.maps.Marker({
      position: {
        lat: 44.83555556,
        lng: 38.77666667
      },
      icon: neutralware
    }),
    "MK Warehouse": new google.maps.Marker({
      position: {
        lat: 44.71000000,
        lng: 39.57055556
      },
      icon: neutralware
    })
  }
  farp_markers["NW Warehouse"].setMap(map);
  farp_markers["SW Warehouse"].setMap(map);
  farp_markers["NE Warehouse"].setMap(map);
  farp_markers["SE Warehouse"].setMap(map);
  farp_markers["MK Warehouse"].setMap(map);

  airfield_markers = {
    anapa: new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 45.003819,
        lng: 37.340428
      },
      icon: blueap
    }),
    Novorossiysk: new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 44.654408,
        lng: 37.747581
      },
      icon: neutralap
    }),
    Gelendzhik: new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 44.593661,
        lng: 38.025664
      },
      icon: neutralap
    }),
    Krymsk: new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 44.959005,
        lng: 37.990819
      },
      icon: neutralap
    }),
    "Krasnodar-Center": new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 45.082458,
        lng: 38.946658
      },
      icon: neutralap
    }),
    "Krasnodar-Pashkovsky": new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 45.034412,
        lng: 39.166349
      },
      icon: neutralap
    }),
    "MK Warehouse": new google.maps.Marker({
      opacity: 0.0,
      position: {
        lat: 45.034412,
        lng: 39.166349
      },
      icon: neutralap
    }),
    maykop: new google.maps.Marker({
      opacity: 0.8,
      position: {
        lat: 44.653333,
        lng: 40.09
      },
      icon: redap
    })
  }

  airfield_markers['anapa'].setMap(map);
  airfield_markers['Novorossiysk'].setMap(map);
  airfield_markers['Gelendzhik'].setMap(map);
  airfield_markers['Krymsk'].setMap(map);
  airfield_markers['Krasnodar-Center'].setMap(map);
  airfield_markers['Krasnodar-Pashkovsky'].setMap(map);
  airfield_markers['maykop'].setMap(map);

  getState();
  setInterval(getState, updateInterval);
}

getState = function () {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open("GET", "http://dcs.hoggitworld.com:5000/state");
  xhr.onload = function () {
    if (xhr.status === 200) {
      var state = JSON.parse(xhr.responseText);
      updateMap(state);
    }
  }
  xhr.send();
}

generateWindow = function (aircraft) {
  if (aircraft.unit.playerName) {
    var content = "<b>PILOT:</b> " + aircraft.unit.playerName;
    content += "<br><b>TYPE:</b> " + aircraft.unit.type + "<br><b>AGE:</b> " + lastUpdated(aircraft) + " sec"
  } else {
    var content = "<b>TYPE:</b> " + aircraft.unit.type + "<br><b>AGE:</b> " + lastUpdated(aircraft) + " sec"
  }

  content += "<br><b>HDG:</b> " + aircraft.unit.heading
  content += "<br><b>SPD:</b> " + Math.round(aircraft.unit.speed) + " kts"
  content += "<br><b>ALT:</b> " + Math.round(aircraft.unit.height * 3.28) + " FT / " + Math.round(aircraft.unit.height) + " M"
  return content;
}

lastUpdated = function (aircraft) {
  let time = new Date();
  return (time - aircraft.updated) / 1000;
}

updateAircraft = function (unit, icon) {

}

updateMap = function (state) {
  let updatedItems = [];
  // Update all the aircraft first, this will get us accurate contact age information
  for (aircraftid in aircraft) {
    var this_ac = aircraft[aircraftid];
    this_ac.window.setContent(generateWindow(this_ac));
  }

  state.blue.forEach((unit) => {
    if (aircraft[unit.id] === undefined) {
      var iconUrl = getIcon("blue", unit);
      var icon = {
        url: iconUrl,
        labelOrigin: new google.maps.Point(15, 40),
        scaledSize: new google.maps.Size(iconScale, iconScale), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
      };

      console.log(iconUrl);
      aircraft[unit.id] = {
        "unit": unit,
        "updated": new Date(),
        "marker": new google.maps.Marker({
          position: {
            lat: unit.lat,
            lng: unit.long
          },
          icon: icon
        })
      }
      if (unit.playerName) aircraft[unit.id].marker.setLabel({
        fontSize: "12px",
        text: unit.playerName,
        fontWeight: "800"
      })
      aircraft[unit.id].window = new google.maps.InfoWindow({
        content: generateWindow(aircraft[unit.id])
      })
      aircraft[unit.id].marker.addListener('click', function () {
        if (window.lastOpenWindow) {
          window.lastOpenWindow.close();
          if (window.lastOpenWindow !== aircraft[unit.id].window) {
            aircraft[unit.id].window.open(map, aircraft[unit.id].marker);
            window.lastOpenWindow = aircraft[unit.id].window;
          } else {
            window.lastOpenWindow = null;
          }
        } else {
          aircraft[unit.id].window.open(map, aircraft[unit.id].marker);
          window.lastOpenWindow = aircraft[unit.id].window;
        }
      });
      aircraft[unit.id].marker.setMap(map);
    } else {
      aircraft[unit.id].updated = new Date();
      aircraft[unit.id].unit = unit
      aircraft[unit.id].marker.setPosition(new google.maps.LatLng(unit.lat, unit.long));
      aircraft[unit.id].window.setContent(generateWindow(aircraft[unit.id]));
    }
    updatedItems.push(aircraft[unit.id]);
  })

  state.red.forEach((unit) => {
    if (aircraft[unit.id] === undefined) {
      var iconUrl = getIcon("red", unit);
      var icon = {
        url: iconUrl,
        scaledSize: new google.maps.Size(iconScale - 2, iconScale), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
      };
      aircraft[unit.id] = {
        "updated": new Date(),
        "unit": unit,
        "marker": new google.maps.Marker({
          position: {
            lat: unit.lat,
            lng: unit.long
          },
          icon: icon
        })
      };
      aircraft[unit.id].window = new google.maps.InfoWindow({
        content: generateWindow(aircraft[unit.id])
      })
      aircraft[unit.id].marker.addListener('click', function () {
        aircraft[unit.id].window.open(map, aircraft[unit.id].marker)
      });

      aircraft[unit.id].marker.setMap(map);
    } else {
      aircraft[unit.id].updated = new Date();
      aircraft[unit.id].unit = unit
      aircraft[unit.id].marker.setPosition(new google.maps.LatLng(unit.lat, unit.long));
      aircraft[unit.id].window.setContent(generateWindow(aircraft[unit.id]));
      aircraft[unit.id].age = 0;
    }
  });

  for (ab in state.ABS) {
    var cur_ab = state.ABS[ab];
    if (cur_ab == 0) {
      airfield_markers[ab].setIcon(neutralap)
    }

    if (cur_ab == 1) {
      airfield_markers[ab].setIcon(redap)
    }

    if (cur_ab == 2) {
      airfield_markers[ab].setIcon(blueap)
    }
  }

  for (farp in state.FARPS) {
    var cur_farp = state.FARPS[farp];
    if (cur_farp == 0) {
      farp_markers[farp].setIcon(neutralware)
    }

    if (cur_farp == 1) {
      farp_markers[farp].setIcon(redware)
    }

    if (cur_farp == 2) {
      farp_markers[farp].setIcon(blueware)
    }
  }
  for (aircraftid in aircraft) {
    let this_ac = aircraft[aircraftid];
    if (lastUpdated(this_ac) > 3 * (updateInterval / 1000)) {
      console.log("Unit [" + this_ac.unit.name + "] had age older than 3 updates and was removed from the map.")
      this_ac.marker.setMap(null);
      aircraft[aircraftid] == null;
    } else {
      //Reduce transparency on older planes
      let transparency_effect = (lastUpdated(this_ac) / 30)
      // console.log("Transparency formula: 1.0 - ("+lastUpdated(this_ac)+ " / 30) = "+ transparency_effect )
      let transparency = 1.0 - transparency_effect
      // console.log("Reducing transparency on unit [ " + this_ac.unit.type + " ] to [ " + transparency + " ]")
      this_ac.marker.setOptions({
        'opacity': transparency
      })
    }
  }

}