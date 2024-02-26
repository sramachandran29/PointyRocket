import React, { useEffect, useRef, useState } from 'react';
import MapView, {Marker, Circle, Polyline} from 'react-native-maps';
import { Text, StyleSheet, View, TouchableOpacity, Image, TextInput, Pressable } from 'react-native';
import Modal from "react-native-modal";


// initial region when map laods
const initialRegion = {
    latitude: 48.8584,
    longitude: 2.2945,
    latitudeDelta:  0.01,
    longitudeDelta: 0.01
};

const primaryCol = '#ED7D31' //'#FFBB64';
const secondaryCol = '#4F4A45'//'#2D3250';
const accent = 'white';

const ipAddressDraw = 'https://factual-moved-snapper.ngrok-free.app/submit_path';
const ipAddressSave = 'https://factual-moved-snapper.ngrok-free.app/save_data';
const ipAddressRoute = 'https://factual-moved-snapper.ngrok-free.app/traveling_salesman';

const routerRange = 94 // meters


const origin = '../assets/start.png';
const router = '../assets/router.png'; // 64px
const cancel = '../assets/cancel.png';
const checkmark = '../assets/destinations.png';

export default function GoogleMap({ searchLocation, setSearchLocation, userLocation,
    marker, setMarker,
    addPin, 
    removePin, setRemovePin, 
    drawPath, 
    deletePath, setDeletePath,
    setDrawn,
    submit, isSubmit,
    toSave, isToSave,
    isStartLoc, isDestination,
    isRoute, setRoute,
    newPath, setNewPath,
    setStartLocationBoolean,
    setStopsAdded,
    deleteTravelSalesman, setDeleteTravelSalesman
 }) {

    const mapRef = useRef(null);

    const [center, setCenter] = useState(initialRegion);
    
    const [polylinePath, setPolylinePath] = useState([]);

    const [mapType, setMapType] = useState('standard');

    const [startLocation, setStartLocation] = useState(null);

    const [ destinations, setDestinations] = useState([]);

    const [inputValue, setInputValue] = useState('');

  



    // ? when user searches a place
    const handleSearchLocation = () => {
        
        if (searchLocation) {
            console.log('inside chanign map');

            mapRef.current.animateToRegion({
                ...center,
                ...searchLocation,
            });

            setCenter({
                latitude: searchLocation.lat,
                longitude: searchLocation.lng,
                latitudeDelta:  0.01,
                longitudeDelta: 0.01
            }); 
            

            

            setSearchLocation(null);
        }
    }

    useEffect(() => { handleSearchLocation(); }, [searchLocation]);

    // TODO focus map to user locaiton
    const focusUser = () => {
        if (userLocation) {
            mapRef.current.animateToRegion({
                ...center,
                ...userLocation,
            });
        }
    }

    // TODO focus map where marker placed
    const focusMarker = () => {

        if (marker) {
            mapRef.current.animateToRegion({
                ...center,
                ...marker,
            });
        }
    }

    // TODO chnages map vew type
    const changeMapType = () => {
        switch (mapType) {
            case 'standard':
                setMapType('satellite');
                break;
            default:
                setMapType('standard');
        }
    };

    //  TODO user input for path name
    const handleInputChange = (text) => {
        if (text.length <= 20) setInputValue(text);
    };
    
    
    // * adds marker
    const addMarker = (event) => {

        // adds router location
        if(addPin){
            const { coordinate } = event.nativeEvent;
            setMarker(coordinate);
            setPolylinePath([]);
        }

        // adds start location for drone
        else if (marker && isStartLoc){
            const { coordinate } = event.nativeEvent;
            setStartLocation(coordinate);
            setStartLocationBoolean(true);
        }

        // have to ensure start locaiton added
        else if (marker && startLocation && isDestination) {
            const { coordinate } = event.nativeEvent;
            setDestinations([...destinations, coordinate]);
            setStopsAdded(true);
            console.log('total destinations added', destinations.length);
        };

    };

    // * removes marker
    const removeMarker = () => { 
        if (removePin) {
            setMarker(null);
            setRemovePin(false);
            setPolylinePath([]);
            setDrawn(false);

            setStartLocation(null);
            setStartLocationBoolean(false);
            setStopsAdded(false);
            setDestinations([]);

        }
    };

    

    //  * removes origin and destination markers if possible
    const removeOriginAndDestination = () => {
        if (deleteTravelSalesman && destinations) {
 
                setStartLocation(null);
                setStartLocationBoolean(false);
                setDestinations([]);
                setStopsAdded(false);
                setDeleteTravelSalesman(false);
            
        };
            
            
           
    };

    

   



    // * draws path
    const getPoint = (event) => {
        
        const { coordinate } = event.nativeEvent;
        if (marker && isPointInsideCircle(coordinate, marker, routerRange)) {
            // console.log("locaiton", coordinate);
            setPolylinePath([...polylinePath, coordinate]);

            // console.log(polylinePath);
            setDrawn(true);
           
        }
    };

    // * deletes path 
    const deletePolyPath = () => {
        if(deletePath && marker && polylinePath){
            setPolylinePath([]);
            setDeletePath(false);
            setDrawn(false);
        }
    };

    

    // * adds loaded path
    const addLoadedPath = () => {
        if(newPath){

            
            setMarker(newPath.center);
            setPolylinePath(newPath.route);
            focusMarker();
            setNewPath(null);
        }
    };

    



    // * when submitting file
    // submits either drawn path or travel salesman markers
    const submitPath = () => {

        // drawn path to backend
        if (submit && polylinePath){
            const data = { center: marker ,route : polylinePath };
            
            try {
                fetch(ipAddressDraw, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })

                console.assert('Data is sent');
            }
            catch (error){
                console.error('An error occurred during drawing submission:', error.message);
            }

            
            isSubmit(false);

        } 

        // travel salesman markers to backend
        else if ( isRoute && startLocation && destinations) {
            const data = { center: marker, startPoint: startLocation, stops: destinations };
        
            try {
                fetch(ipAddressRoute, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                console.log('Data is sent');
            }
            catch (error) {
                console.error('An error occurred during travel salesman submission:', error.message);
            }
            removeMarker();
            setRoute(false);
        };
    };

    // * when saved button is clicked
    // saves only drawn path
    const savePath = () => {

        if (polylinePath && inputValue) {

            const data = {
                name: inputValue,
                center: marker,
                route: polylinePath
            }

            // closes pop up box
            isToSave(false);
            setInputValue(''); // CLEARS input

            console.log('data that is saved', data.name);
            console.log('length of path', data.route.length);
          
            try {     
                fetch(ipAddressSave, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
            } catch (error) {
                console.error('An error occurred during saving:', error.message);
             }

        };
    };

    useEffect(() => { removeMarker(); }, [removePin]);
    useEffect(() => { removeOriginAndDestination(); }, [deleteTravelSalesman]);
    useEffect(() => { deletePolyPath(); }, [deletePath]);
    useEffect(() => { addLoadedPath(); }, [newPath]);
    useEffect(() => { submitPath(); }, [submit, isRoute])


    return (
        <View style={styles.container}>

            <Modal isVisible={toSave} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: secondaryCol, width: '90%',  padding: 16, borderRadius: '20%' }}>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ fontSize: 30, color: primaryCol }}>Select Path to Load</Text>
                        <TouchableOpacity onPress={() => { isToSave(false)  }}>
                            <Image
                                source={require(cancel)}
                                style={{ height: 30, width: 30 }}
                            ></Image>
                        </TouchableOpacity>
                    </View>

                    <Text style={{
                        fontSize: 18, color: primaryCol, marginBottom: -10, marginLeft: 8, backgroundColor: secondaryCol, zIndex: 10, width: 58, paddingLeft: 4 }}>Name</Text>
                    <TextInput
                        placeholder="Name: max 20 characters"
                        placeholderTextColor= {accent}
                        value={inputValue}
                        onChangeText={handleInputChange}
                        color= {primaryCol}
                        style={{
                            fontSize: 18,
                            borderWidth: 1,
                            borderColor: primaryCol,
                            borderRadius: 5,
                            padding: 10,
                            marginBottom: 10,
                        }}
                    />

                    <TouchableOpacity onPress={savePath}>
                        <View style={{
                            marginBottom: 8, backgroundColor: primaryCol, borderWidth: 1,
                            borderColor: primaryCol, borderRadius: 5, padding: 10}}>
                            <Text style={{
                                fontSize: 18, color: accent
                            }}>Save Path</Text>
                        </View>
                    </TouchableOpacity>

                    
                </View>
            </Modal>

            <View style={styles.features}>

                
                <Text style={styles.featureItem}> Distance </Text>
                <Text style={styles.featureItem}> Color </Text>
                
                <Text style={styles.featureItem} onPress={changeMapType}> {mapType.charAt(0).toUpperCase() + mapType.slice(1)} </Text>
                <Text style={styles.featureItem} onPress={focusMarker}> Map Focus </Text>
                <Text style={styles.featureItem} onPress={focusUser} > My Location </Text>
                

            </View>

            <MapView 
                ref={mapRef}
                style={styles.map}
                initialRegion={center}
                mapType= {mapType}
                provider={MapView.PROVIDER_GOOGLE}
                zoomEnabled
                showsCompass
                showsScale
                showsBuildings
                zoomControlEnabled
                userInterfaceStyle='dark'
                showsUserLocation = {true}
                loadingEnabled={true}
                showsMyLocationButton
                showsPointsOfInterest
                onPress={addMarker}
                onPanDrag={drawPath? getPoint: null}
                scrollEnabled={!drawPath}
             >

             {marker && (
                    <>

                        {polylinePath && (
                            <Polyline
                                coordinates={polylinePath}
                                strokeColor={'#ED7D31'}
                                strokeWidth={1.5}
                                
                            />
                        )}

                        <Circle
                            center={marker}
                            radius={routerRange}
                            fillColor='rgba(237, 125, 49, 0.05)'
                            onPanDrag={getPoint}
                            strokeColor='grey'
                            // strokeWidth="2"
                        /> 
                        <Marker
                            coordinate={marker}
                            image={require(router)}
                            style = {{opacity: 1}}
                        />

                        {startLocation && (
                            <Marker
                                coordinate={startLocation}
                                image={require(origin)}
                            />
                        )}

                        {destinations && destinations.map((destination, index) => (
                            <Marker
                                key={index} // Make sure to set a unique key for each marker
                                coordinate={destination}
                                image={require(checkmark)}
                                
                            />
                        ))}
                       

                        
                    </>
             )}

            </MapView>
        </View>
    );
}

// Function to check if a coordinate is inside a circle
const isPointInsideCircle = (point, circle, radius) => {
    // Convert degrees to radians
    const toRadians = (angle) => (angle * Math.PI) / 180;

    // Haversine formula to calculate distance
    const haversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // Earth radius in meters
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    };

    const distance = haversine(point.latitude, point.longitude, circle.latitude, circle.longitude);
    
    return distance <= radius;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    features: {
        height: '8%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
    },

    featureItem: {
        color: 'white',
        
    },

    map: {
        width: '100%',
        height: '92%',
    },
});

