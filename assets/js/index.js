/* ----------------------------
/*  Name: ISS Tracking
    Author: JZ
    Version: 1.0
/* -------------------------- */
let timerInterval;
let map, marker;
let flightPath;


stationISS = {
    longitude: 0,
    latitude: 0,
    timestamp: 0,
    arrayOfMeasures: [],
    setPosition: function(long, lat) {
        this.longitude = parseFloat(long);
        this.latitude = parseFloat(lat);
    },
    setTimestamp: function(timestamp) {
        this.timestamp = timestamp;
    },
    addMeasure: function() {
        this.arrayOfMeasures.push([this.latitude, this.longitude, this.timestamp]);
    },
    clean: function() {
        this.longitude = 0;
        this.latitude = 0;
        this.timestamp = 0;
        this.arrayOfMeasures = [];
    }
};

function downloadIssDataStart() { // clicking start Tracking
fetch("http://api.open-notify.org/iss-now.json")
    .then(data => {
        data.json()
            .then(data => {
                stationISS.setPosition(data.iss_position.longitude, data.iss_position.latitude);
                stationISS.setTimestamp(data.timestamp);
                stationISS.addMeasure();
                setNewMapPosition(stationISS.latitude, stationISS.longitude);          
            })
            .then(() => {
                if(stationISS.arrayOfMeasures.length > 1) {
                document.querySelector('.table-last-speed').innerHTML = `${Math.round(calculateSpeed(stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 2)], stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 1)]) * 100) / 100} km/s`;

                document.querySelector('.table-average-speed').innerHTML = `${Math.round(calculateSpeed(stationISS.arrayOfMeasures[0], stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 1)]) * 100) / 100} km/s`;

                document.querySelector('.table-total-road').innerHTML = `${Math.round(calculateRoad(stationISS.arrayOfMeasures[0], stationISS.arrayOfMeasures[stationISS.arrayOfMeasures.length - 1]) * 100) / 100} km`;

                document.querySelector('.table-last-point').innerHTML = `Lat: ${stationISS.latitude} Long: ${stationISS.longitude}`;
                }
            })
    })
    document.querySelector('#button').innerHTML = `Stop tracking!`;
    document.querySelector('#button').removeEventListener('click', handleStartTracking);
    document.querySelector('#button').addEventListener('click', handleStopTracking);
}

function downloadIssDataStop() { // clicking end Tracking
    fetch("http://api.open-notify.org/iss-now.json")
        .then(data => {
            data.json()
                .then(data => {
                    stationISS.setPosition(data.iss_position.longitude, data.iss_position.latitude);
                    stationISS.setTimestamp(data.timestamp);
                    stationISS.addMeasure();
                    setNewMapPosition(stationISS.latitude, stationISS.longitude);
                })
                .then(() => {
                    document.querySelector('#button').innerHTML = `Start tracking`;
                    document.querySelector('#button').removeEventListener('click', handleStopTracking);
                    document.querySelector('#button').addEventListener('click', handleStartTracking);

                    document.querySelector('.table-last-speed').innerHTML = `${Math.round(calculateSpeed(stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 2)], stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 1)])*100)/100} km/s`;

                    document.querySelector('.table-average-speed').innerHTML = `${Math.round(calculateSpeed(stationISS.arrayOfMeasures[0], stationISS.arrayOfMeasures[(stationISS.arrayOfMeasures.length - 1)])*100)/100} km/s`;

                    document.querySelector('.table-total-road').innerHTML = `${Math.round(calculateRoad(stationISS.arrayOfMeasures[0], stationISS.arrayOfMeasures[stationISS.arrayOfMeasures.length - 1])*100)/100} km`;
                    document.querySelector('.table-last-point').innerHTML = `Lat: ${stationISS.latitude} Long: ${stationISS.longitude}`;
                    if (document.querySelector('#button-show-road').classList[0] != 'btn' && document.querySelector('#button-clean-data').classList[0] != 'btn') {
                        activateButton();
                    }
                })
        })

}

function initMap() {
    let options = {
        zoom: 5,
        center: {
            lat: stationISS.latitude,
            lng: stationISS.longitude
        }
    }
        map = new google.maps.Map(document.getElementById('map'), options);
        marker = new google.maps.Marker({
        position: {lat: stationISS.latitude, lng: stationISS.longitude},
        map: map,
        icon: 'assets/images/satellite1.png'
    });
}

function setNewMapPosition(latitude, longitude) {

    map.setCenter({ lat: latitude, lng: longitude });
    marker.setPosition({ lat: latitude, lng: longitude }); 
}

function calculateSpeed(startingPosition, endPosition) { // haversine formule

    let d = calculateRoad(startingPosition, endPosition);

    let seconds = endPosition[2] - startingPosition[2];
    return d/seconds;

}

function calculateRoad(startingPosition, endPosition) {

    function toRad(x) {
        return x * Math.PI / 180;
    }

    let dLat = toRad(endPosition[0] - startingPosition[0]);
    let dLon = toRad(endPosition[1] - startingPosition[1])

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(startingPosition[0])) *
        Math.cos(toRad(endPosition[0])) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    let d = 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // road in km

    return d;

}

function handleStartTracking() {
    if(stationISS.arrayOfMeasures.length != 0) {
        handleClickHideRoad();
    }
    if (document.querySelector('#button-show-road').classList[0] == 'btn' && document.querySelector('#button-clean-data').classList[0] == 'btn') {
        deactivateButton();
    }

    downloadIssDataStart();
    timerInterval = setInterval(downloadIssDataStart, 5300);
}

function handleStopTracking() {
    clearInterval(timerInterval);
    downloadIssDataStop();
}

function drawRoad() {
    let coordinatesObject = [];
    stationISS.arrayOfMeasures.map((x) => {
        coordinatesObject.push({ lat: x[0], lng: x[1] });
    })
    flightPath = new google.maps.Polyline({
        path: coordinatesObject,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    flightPath.setMap(map);
}

function cleanRoad() {
    flightPath.setMap(null);

}

function handleClickShowRoad() {
    drawRoad();
    document.querySelector('#button-show-road').innerHTML = 'Hide road';
    document.querySelector('#button-show-road').removeEventListener('click', handleClickShowRoad);
    document.querySelector('#button-show-road').addEventListener('click', handleClickHideRoad);
    
}

function handleClickHideRoad() {
    cleanRoad();
    document.querySelector('#button-show-road').innerHTML = 'Show road';
    document.querySelector('#button-show-road').removeEventListener('click', handleClickHideRoad);
    document.querySelector('#button-show-road').addEventListener('click', handleClickShowRoad);
    
}

function handleClickCleanData() {
    clearMeasures();
    if (document.querySelector('#button-show-road').classList[0] == 'btn' && document.querySelector('#button-clean-data').classList[0] == 'btn') {
        deactivateButton();
    }
    if (document.querySelector('#button-show-road').innerHTML == 'Hide road') {
        handleClickHideRoad();
    }
}

function clearMeasures() {
    stationISS.clean();    
}

function activateButton() {
    let cleanButton = document.querySelector('#button-clean-data');
    let showRoadButton = document.querySelector('#button-show-road');

    showRoadButton.classList.toggle('btn-disabled');
    showRoadButton.classList.toggle('btn');
    cleanButton.classList.toggle('btn-disabled');
    cleanButton.classList.toggle('btn');
}

function deactivateButton() {
    let cleanButton = document.querySelector('#button-clean-data');
    let showRoadButton = document.querySelector('#button-show-road');

    showRoadButton.classList.toggle('btn');
    showRoadButton.classList.toggle('btn-disabled');
    cleanButton.classList.toggle('btn');
    cleanButton.classList.toggle('btn-disabled');
}

document.querySelector('#button').addEventListener('click', handleStartTracking);
document.querySelector('#button-show-road').addEventListener('click', handleClickShowRoad);
document.querySelector('#button-clean-data').addEventListener('click', handleClickCleanData);