var arDrone  = require('ar-drone');
var PID      = require('./PID');
var vincenty = require('node-vincenty');
var ipdrone = { ip: '192.168.1.1' };

var targetlat = ;  //coordenadas
var targetlng = ;
var yawPID = new PID(1.0, 0, 0.30);
//var client = arDrone.createClient();

var drone = arDrone.createClient(ipdrone);
drone.config('general:navdata_demo', 'FALSE');
drone.config('general:navdata_options', 777060865);
drone.config('video:video_channel', 0);

var targetlat = null, targetlng = null, targetYaw = null, currentYaw = null;
var battery = 0;

var navdata = {
    bateria: 0, altitud: 0, velocidad: { x: 0, y: 0, z: 0 }, gps: { lat: 0.0, lng: 0.0, nsatelites: 0 }, emergency: 0,
    state: 0, running: 0, control: 0, altura: { min: 2, max: 3 },
    motion: {right: 0.5, left: 0.5, up: 0.5, down: 0.5, front:0.5, back: 0.5, clockwise: 0.5, cclockwise: 0.5},
    camara: 0
};

var stop = function(){
  console.log('stop', data)
  targetYaw = null
  targetLat = null
  targetLon = null
  drone.stop()
}

var handleNavData = function(data){
  if ( data.demo == null || data.gps == null) return;
  battery = data.demo.batteryPercentage
  currentLat = data.gps.latitude
  currentLon = data.gps.longitude

  currentYaw = data.demo.rotation.yaw;

  if (targetLat == null || targetLon == null || currentYaw ==  null || currentLat == null || currentLon == null) return;

  var bearing = vincenty.distVincenty(currentLat, currentLon, targetLat, targetLon)

  if(bearing.distance > 1){
    currentDistance = bearing.distance
    console.log('distance', bearing.distance)
    console.log('bearing:', bearing.initialBearing)
    targetYaw = bearing.initialBearing

    console.log('currentYaw:', currentYaw);
    var eyaw = targetYaw - currentYaw;
    console.log('eyaw:', eyaw);

    var uyaw = yawPID.getCommand(eyaw);
    console.log('uyaw:', uyaw);

    var cyaw = within(uyaw, -1, 1);
    console.log('cyaw:', cyaw);

    client.clockwise(cyaw)
    client.front(0.05)
  } else {
    targetYaw = null
    io.sockets.emit('waypointReached', {lat: targetLat, lon: targetLon})
    console.log('Reached ', targetLat, targetLon)
    stop()
  }
}

client.on('navdata', handleNavData);

function within(x, min, max) {
  if (x < min) {
      return min;
  } else if (x > max) {
      return max;
  } else {
      return x;
  }
}
