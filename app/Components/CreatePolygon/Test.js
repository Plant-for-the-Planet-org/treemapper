import React, { Component } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import MapboxGL from "@react-native-mapbox-gl/maps";
import { camera, marker,  active_marker } from '../../assets/index';
const Realm = require('realm');
MapboxGL.setAccessToken('pk.eyJ1IjoiaGFpZGVyYWxpc2hhaCIsImEiOiJjazlqa3FrM28wM3VhM2RwaXdjdzg0a2s4In0.0xQfxFEfdvAqghrNgO8o9g');
// import datas from './data.json'
// console.log(datas, '------------------- start ------------')
// Type 2: Persistent datastore with manual loading
// let Datastore = require('react-native-local-mongodb')
// let db = new Datastore({ filename: 'asyncStorageKey' });
// db.loadDatabase(function (err) {  // Callback is optional
//   // Now commands will be executed
// });
// import Vasern from 'vasern';
// const VasernDB = new Vasern({
//   schemas: [{
//     name: "Users",
//     props: {
//       fname: "string",
//       lname: "string"
//     }
//   }, {
//     name: "Todos",
//     props: {
//       name: "string",
//       completed: "boolean",
//       assignTo: [{ name: 'string', uni: 'string' }]
//     },
//   }, {
//     name: 'todos',
//     props: {
//       text: 'string',
//       dataa: []
//     },
//   }]
// });
// VasernDB.todos.onChange(() => {
//   // Get all todo items with "completed" is "false"
//   const todoList = VasernDB.todos;
//   console.log(todoList._data, 'todoList._data')
//   // todoList._data.map((x) => console.log(x, "DATA"))
//   // Update state
//   // this.setState({ data: todoList.data() });
// })
// VasernDB.todos.insert({
//   text: "123",
//   dataa: ['nasir', 'yasir','popopo']
// })
export default class App extends Component {
  componentDidMount() {
    // Define your models and their properties
    const CarSchema = {
      name: 'Car',
      properties: {
        make: 'string',
        model: 'string',
        miles: { type: 'int', default: 0 },
      }
    };
    const PersonSchema = {
      name: 'Person',
      primaryKey: 'id',
      properties: {
        id: 'int',
        name: 'string',
        birthday: 'date',
        cars: 'Car[]', // a list of Cars
        picture: 'data?' // optional property
      }
    };
    Realm.open({ schema: [CarSchema, PersonSchema] })
      .then(realm => {
        // Create Realm objects and write to local storage
        realm.write(() => {
          const myPer = realm.create('Person', {
            name: "yasir",
            // id: 6,
            birthday: new Date(),
            cars: [{
              make: 'nasir=',
              model: '7777777al',
              miles: 1000000,
            }]
          }, 'modified', true)
          const Person = realm.objects('Person');
          // realm.delete(realm.objectForPrimaryKey('Person', 1));
          // realm.delete(Person)
          this.setState({ data: Person })
        });
        // Query Realm for all cars with a high mileage
        // realm.write(() => {
        //   const Person = realm.objects('Person');
        //   realm.delete(Person)
        //   this.setState({ data: Person })
        // })
        // Will return a Results object with our 1 car
        // cars.length // => 1
        // Add another car
        // realm.write(() => {
        //   const myCar = realm.create('Car', {
        //     make: 'Ford',
        //     model: 'Focus',
        //     miles: 2000,
        //   });
        // });
        // Query results are updated in realtime
        // cars.length // => 2
        // Remember to close the realm when finished.
        realm.close();
      })
      .catch(error => {
        console.log(error);
      });
    // datas.list.push({ name: "FUUASR" })
    // console.log(datas, 'datadatadata');
    // fetch(`data.json`)
    //   .then(response => response.json())
    //   .then(data => console.log(data))
    MapboxGL.setTelemetryEnabled(false);
    // db.insert({ name: 'Masdasdas' }, function (err, newDoc) {  // Callback is optional
    //   // newDoc is the newly inserted document, including its _id
    //   // newDoc has no key called notToBeSaved since its value was undefined
    // });
    // Find all documents in the collection
    // db.find({}, function (err, docs) {
    //   console.log(docs, 'DOCS')
    // });
    // fetch(`data.json`)
    //   .then(response => response.json())
    //   .then(data => console.log(data))
  }
  state = {
    data: '',
    centerCoordinates: [0, 0],
    activePolygonIndex: 0,
    markers: {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": [
            ]
          }
        }
      ]
    }
  }
  _onBtn = () => {
    let markers = this.state.markers;
    markers.features[this.state.activePolygonIndex].geometry.coordinates.push(this.state.centerCoordinates);
    this.setState({ markers })
  }
  render() {
    let obj = JSON.stringify(this.state.data)
    console.log(JSON.parse(obj))
    return (<View>
      <Text>{JSON.stringify(obj)}</Text>
    </View>
      // <MapboxGL.MapView
      //   centerCoordinate={[-71.034439, 42.346892]}
      //   ref={(ref) => this._map = ref}
      //   style={styles.map}
      // >
      // </MapboxGL.MapView>
      // <View style={[styles.page, { flex: 1 }]}>
      /* <MapboxGL.MapView
        centerCoordinate={[-71.034439, 42.346892]}
        ref={(ref) => this._map = ref}
        style={styles.map}
      >
      </MapboxGL.MapView> 
      <Text>Text</Text>*/
      /* <View style={styles.container}>
        <MapboxGL.MapView
          ref={(ref) => this._map = ref}
          style={styles.map}
          onRegionDidChange={async (data) => {
            const center = await this._map.getCenter();
            this.setState({ centerCoordinates: center })
          }}
        >
          <MapboxGL.Camera
            ref={(ref) => (this._camera = ref)}
          >
          </MapboxGL.Camera>
          <MapboxGL.ShapeSource id='line1' shape={this.state.markers}>
            <MapboxGL.LineLayer id='linelayer1' style={{ lineColor: 'red', lineWidth: 2, lineColor: '#000' }} />
          </MapboxGL.ShapeSource>
          <MapboxGL.PointAnnotation
            key="pointAnnotation"
            id="pointAnnotation"
            coordinate={this.state.centerCoordinates}>
          </MapboxGL.PointAnnotation>
          <MapboxGL.UserLocation
            onUpdate={(location) => {
              if (!this.state.isInitial) {
                const currentCoords = [location.coords.longitude, location.coords.latitude]
                this.setState({ centerCoordinates: currentCoords, isInitial: true }, () => {
                  this._onBtn()
                })
                this._camera.setCamera({
                  centerCoordinate: currentCoords,
                  zoomLevel: 14,
                  animationDuration: 2000,
                })
              }
            }}
          >
          </MapboxGL.UserLocation>
        </MapboxGL.MapView>
      </View>
      <View style={{ position: 'absolute', left: '50%', top: '50%', justifyContent: 'center', alignItems: 'center' }} >
        <Image
          source={active_marker}
          style={{
            position: 'absolute',
            resizeMode: 'contain',
            bottom: 0
          }} />
      </View> */
      /* <View style={{
        height: 130,
        width: 100, position: 'absolute',
      }}>
        <Image
          source={active_marker}
          style={{
            flex: 1,
            resizeMode: 'contain',
            height: 60,
            width: 40,
            marginBottom: 70,
            marginLeft: 30
          }} />
      </View> */
      /* <View style={{ flexDirection: 'row', position: 'absolute', bottom: 0, backgroundColor: '#fff', width: '100%' }}>
        <TouchableOpacity style={{ padding: 20, backgroundColor: '#fff' }} onPress={this._onBtn}>
          <Text>Next Marker</Text>
        </TouchableOpacity>
      </View> */
      // </View>
    );
  }
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  container: {
    height: 300,
    width: '100%',
    flex: 1,
    backgroundColor: "tomato"
  },
  map: {
    flex: 1
  }
});
const lneData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            67.03668594360352,
            24.990648008374237
          ],
          [
            67.08818435668945,
            25.02176204483019
          ]
        ]
      }
    }
  ]
};
const data = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "asdasd": "asdas",
        "type": "Polygon",
        "coordinates": [
          [
            [
              48.251953125,
              64.69910544204765
            ],
            [
              43.505859375,
              60.80206374467983
            ],
            [
              60.46875,
              59.5343180010956
            ],
            [
              48.251953125,
              64.69910544204765
            ]
          ]
        ]
      }
    }
  ]
}
let dataSource2 = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "asdasd": "asdas",
        "type": "Polygon",
        "coordinates": [
          [
            [
              48.251953125,
              64.69910544204765
            ],
            [
              43.505859375,
              60.80206374467983
            ],
            [
              60.46875,
              59.5343180010956
            ],
            [
              48.251953125,
              64.69910544204765
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              78.134765625,
              66.8265202749748
            ],
            [
              73.125,
              63.35212928507874
            ],
            [
              80.947265625,
              62.14497603754045
            ],
            [
              78.134765625,
              66.8265202749748
            ]
          ]
        ]
      }
    }
  ]
}