import React from "react";
import LocationList from "./LocationList";
import {FSQUARE_CLIENT_ID, FSQUARE_CLIENT_SECRET, GOOGLE_MAPS_KEY} from './Keys'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            locations: require("./locations.json"),
            map: "",
            infoWindow: "",
            marker: ""
        };
    }

    componentDidMount() {
        window.initMap = this.initMap;
        loadMapJS(
            "https://maps.googleapis.com/maps/api/js?key="+GOOGLE_MAPS_KEY+"&callback=initMap"
        );
    }

    initMap = () => {
        const self = this;
        const view = document.getElementById("map");
        view.style.height = window.innerHeight + "px";
        const map = new window.google.maps.Map(view, {
            center: { lat: 39.29127, lng: -76.6209671 },
            zoom: 13,
            mapTypeControl: false
        });

        const infoWindow = new window.google.maps.InfoWindow({});
        window.google.maps.event.addListener(infoWindow, "closeclick", function() {
            self.closeInfoWindow();
        });

        this.setState({
            map: map,
            infoWindow: infoWindow
        });

        window.google.maps.event.addDomListener(window, "resize", function() {
            const center = map.getCenter();
            window.google.maps.event.trigger(map, "resize");
            self.state.map.setCenter(center);
        });

        window.google.maps.event.addListener(map, "click", function() {
            self.closeInfoWindow();
        });

        let locations = [];
        this.state.locations.forEach(function(location) {
            const name = location.name + " - " + location.type;
            let marker = new window.google.maps.Marker({
                position: new window.google.maps.LatLng(
                    location.latitude,
                    location.longitude
                ),
                animation: window.google.maps.Animation.DROP,
                map: map
            });

            marker.addListener("click", function() {
                self.openInfoWindow(marker);
            });

            location.name = name;
            location.marker = marker;
            location.display = true;
            locations.push(location);
        });
        this.setState({
            locations: locations
        });
    }

    openInfoWindow = (marker) => {
        this.closeInfoWindow();
        this.state.infoWindow.open(this.state.map, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        this.setState({
            marker: marker
        });
        this.state.infoWindow.setContent("Loading information...");
        this.state.map.setCenter(marker.getPosition());
        this.state.map.panBy(0, -200);
        this.getMarkerInfo(marker);
    }

    getMarkerInfo = (marker) => {
        const self = this;
        let url =
            "https://api.foursquare.com/v2/venues/search?client_id="+FSQUARE_CLIENT_ID+"&client_secret=" +
            FSQUARE_CLIENT_SECRET +
            "&v=20130815&ll=" +
            marker.getPosition().lat() +
            "," +
            marker.getPosition().lng() +
            "&limit=1";
        fetch(url)
            .then(function(response) {
                if (response.status !== 200) {
                    self.state.infowindow.setContent("Failed on loading...");
                    return;
                }
                response.json().then(function(data) {
                    console.log(data);

                    const location_data = data.response.venues[0];
                    const place = `<h3>${location_data.name}</h3>`;
                    const street = `<p>${location_data.location.formattedAddress[0]}</p>`;
                    let contact = "";
                    if (location_data.contact.phone)
                        contact = `<p><small>${location_data.contact.phone}</small></p>`;
                    let checkinsCount =
                        "<b>Number of CheckIn: </b>" +
                        location_data.stats.checkinsCount +
                        "<br>";
                    const readMore =
                        '<a href="https://foursquare.com/v/' +
                        location_data.id +
                        '" target="_blank">For more information visit: <b>Foursquare</b></a>';
                    self.state.infoWindow.setContent(
                        place + street + contact + checkinsCount + readMore
                    );
                });
            })
            .catch(function(err) {
                self.state.infoWindow.setContent("Sorry data can't be loaded, please provide the API keys ");
            });
    }

    closeInfoWindow = () =>{
        if (this.state.marker) {
            this.state.marker.setAnimation(null);
        }
        this.setState({
            marker: ""
        });
        this.state.infoWindow.close();
    }

    render() {
        return (
            <div>
                <LocationList
                    key="100"
                    locations={this.state.locations}
                    openInfoWindow={this.openInfoWindow}
                    closeInfoWindow={this.closeInfoWindow}
                />
                <div id="map"/>
            </div>
        );
    }

}

export default App;

/**
 * google maps loader
 */


function loadMapJS(src) {
    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    script.onerror = function () {
        alert("Google Maps can't be loaded, please verify your key");
    }
    ref.parentNode.insertBefore(script, ref);
}

