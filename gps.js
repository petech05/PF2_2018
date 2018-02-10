//

var arDrone  = require('ar-drone');
var PID      = require('./PID');
var vincenty = require('node-vincenty');
var ipdrone = { ip: '192.168.1.1' };

//var targetlat = 19.371801;  //coordenadas
//var targetlng = -70.486310;
var yawPID = new PID(1.0, 0, 0.30);

var drone = arDrone.createClient(ipdrone);
drone.config('general:navdata_demo', 'FALSE');
drone.config('general:navdata_options', 777060865);
//drone.config('video:video_channel', 0);

var targetlat = 19.441219, targetlng = -70.680515, targetYaw = null, currentYaw = null;
var battery = 0;

var navdata = {
    bateria: 0, altitud: 0, velocidad: { x: 0, y: 0, z: 0 }, gps: { lat: 0.0, lng: 0.0, nsatelites: 0 }, emergency: 0,
    state: 0, running: 0, control: 0, altura: { min: 2, max: 3 },
    motion: {right: 0.5, left: 0.5, up: 0.5, down: 0.5, front:0.5, back: 0.5, clockwise: 0.5, cclockwise: 0.5},
    camara: 0
};
//Altura
var alturamax = 2, alturamin = 1;

if(navdata.state == 0){
            console.log('takeoff');
            drone.takeoff();
            drone.after(2000,function(){
                drone.stop();
            });
        }

drone.on('navdata', function(data){
    if(data.demo == null ) return;

    navdata.bateria = data.demo.batteryPercentage;
    navdata.altitud = data.demo.altitude;
    navdata.velocidad.x = data.demo.xVelocity;
    navdata.velocidad.y = data.demo.yVelocity;
    navdata.velocidad.z = data.demo.zVelocity;
    navdata.state = data.droneState.flying;
    navdata.emergency = data.droneState.emergencyLanding;
    currentYaw = data.demo.rotation.yaw;

    if( data.gps== null) return;

    navdata.gps.lat = data.gps.latitude;
    navdata.gps.lng = data.gps.longitude;
    homelat= data.gps.latitude;
    homelng= data.gps.longitude;
    navdata.gps.nsatelites = data.gps.nbSatellites;

    if (targetlat == null || targetlng == null || currentYaw ==  null || navdata.gps.lat == null || navdata.gps.lng == null) return;

    if(navdata.altitud < alturamin) {
        drone.up(0.5);
    } else if(navdata.altitud > alturamax){
        drone.down(0.5);
    }

    var bearing = vincenty.distVincenty(navdata.gps.lat, navdata.gps.lng, targetlat, targetlng);

    if(bearing.distance > 2.5){
        targetYaw = bearing.initialBearing;
        var eyaw = targetYaw - currentYaw;
        var uyaw = yawPID.getCommand(eyaw);
        var cyaw = within(uyaw, -1, 1);
        drone.clockwise(cyaw);
        drone.front(0.2);
    } else {
        console.log("Acabo de llegar!");
        targetYaw = null;
        targetlat = null;
        targetlng = null;
        drone.stop();
        drone.up(0.5);
        drone.down(0.5);
        drone.up(0.5);
        drone.down(0.5);
        drone.after(10000,function(){
                drone.stop();
                var home = vincenty.distVincenty(navdata.gps.lat, navdata.gps.lng, hometlat, homelng);

                if(home.distance > 2.5){
                    homeYaw = bearing.initialBearing;
                    var eyaw = homeYaw - currentYaw;
                    var uyaw = yawPID.getCommand(eyaw);
                    var cyaw = within(uyaw, -1, 1);
                    drone.clockwise(cyaw);
                    drone.front(0.2);
                } else {
                    console.log("Acabo de llegar a Casa!");
                    homeYaw = null;
                    homelat = null;
                    homelng = null;
                    drone.stop();
                    drone.land();
        
                }
       });
    }
}
)

function within (x, min, max) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}