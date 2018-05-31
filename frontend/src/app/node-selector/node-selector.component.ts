import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MAT_BOTTOM_SHEET_DATA } from '@angular/material';
import { ApiService } from '../api/api.service';
import { Node } from '../node';
import { Map, TileLayer, tileLayer, 
         featureGroup, FeatureGroup, 
         GeoJSON, Browser, 
         Control, Marker,
         Icon, DivIcon, geoJSON } from 'leaflet';
import { glyphIcon } from './glyph-icon';
import { waterBodiesData } from './map-data';
import { NodeType } from '../node-type';
import { WaterBody } from '../water-body';
import { Sensor } from '../sensor';
import { ExportSelectorComponent } from '../export-selector/export-selector.component';

@Component({
  selector: 'app-node-selector',
  templateUrl: './node-selector.component.html',
  styleUrls: ['./node-selector.component.css']
})

export class NodeSelectorComponent implements OnInit, AfterViewInit {
  selectedNodeType: string = 'All';
  nodes: Node[];
  nodeTypes: NodeType[];
  map: Map;
  markers: Marker[] = [];
  selectedWaterBody: string[];  // ['name', 'icampff']
  screenWidth: number;
  // The first element of the accordion in the sidenav of the application
  // Should be expanded when the page loads.
  defaultExpandedElement: boolean = true;
  // The type has to be any because the geoJSON function only accepts
  // this kind of object
  waterBodies: any;
  mapReady: boolean = false;
  selectedNode: Node;
  selectedNodeSensors: Sensor[];
  data: string[] = ["dd", "asdf"];  // The data that will be passed to the node-selector component [node_id, variable]
  @ViewChild(ExportSelectorComponent) exportSelector: ExportSelectorComponent;
  
  constructor(private apiService: ApiService, public dialog: MatDialog, public snackBar: MatSnackBar) { 
    // set screenWidth on page load
    this.screenWidth = window.innerWidth;
    window.onresize = () => {
      // set screenWidth on screen size change
      this.screenWidth = window.innerWidth;
      this.fixMap();
    };
  }

  openDialog(variable) {
    this.dialog.open(Dialog, {
      width: '90%',
      height: '90%',
      data: [this.selectedNode._id, variable]
    });
  }

  ngAfterViewInit() {
    this.fixMap();
  }

  fixMap() {
    this.map.invalidateSize();
    if (this.screenWidth > 840) this.map.setView([10.4061961, -75.4364990], 12);
    else this.map .setView([10.4061961, -75.5364990], 12);
  }

  ngOnInit() {
    window.resizeBy(window.innerWidth, window.innerHeight);
    this.getNodes();
    this.map = new Map('mapid');
    
    tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(this.map);
  }

  getWaterBodies() {
    this.apiService.getWaterBodies().subscribe(waterBodies => this.waterBodies = waterBodies,
                                               () => console.log("Couldn't get the water bodies"),
                                               () => this.drawWaterBodies())
  }

  drawWaterBodies() {
    var getColor = (d) => {
      return d > 90 ? '#0032FF' : // blue
              d > 70 ? '#49C502' : // green
                d > 50 ? '#F9F107' : // yellow
                  d > 25 ? '#F57702' : // orange
                    '#FB1502' ; // red
    }
    this.waterBodies.forEach(waterBody => {
      this.apiService.getICAMPff(waterBody._id).subscribe(icam => waterBody.properties.icam = icam, 
                                () => console.log('node-selector: failed to get the ICAMpff'),
                                () => geoJSON(waterBody, {
                                  style: (feature) => {
                                    return {color: getColor(feature.properties.icam)};
                                  }
                                }).bindPopup((layer) => {
                                  return layer.getAttribution();
                                }).addTo(this.map))
    });
    /*
    var waterBodies:GeoJSON = geoJSON(this.waterBodies, {
        style: (feature) => {
          return {color: getColor(this.apiService.getICAMPff(feature.properties._id))};
        }
      }
    ).bindPopup((layer) => {
      return layer.getAttribution();
    }).addTo(this.map);*/
    this.mapReady = true;
  }

  getNodes() {
    this.apiService.getNodes().subscribe(nodes => this.nodes = nodes, 
                                         () => console.log("node-selector: Couldn't get the nodes"), 
                                         () => this.getNodeTypes());
  }

  getNodeTypes() {
    this.apiService.getNodeTypes().subscribe(nodeTypes => this.nodeTypes = nodeTypes,
                                             () => console.log("node-selector: Couldn't get the node types"),
                                             () => this.setMarkers());
  }

  setMarkers() {
    if (!this.mapReady)
      this.getWaterBodies();
    this.nodes.forEach(node => {
      var acronym: string[] = ["E", "E"];
      var nodeType: string;
      this.nodeTypes.forEach(nt => {
        if (nt._id == node.node_type_id) {
          acronym = nt.name.split(' ');
          nodeType = nt.name;
        }
      });
      var ico_url: string;
      switch (node.status) {
        case 'Real Time':
          ico_url = 'assets/glyph-marker-icon-green.png';
          break;
        case 'Non Real Time':
          ico_url = 'assets/glyph-marker-icon-blue.png';
          break;
        case 'Off':
          ico_url = 'assets/glyph-marker-icon-gray.png';
          break;
        default:
          ico_url = 'assets/glyph-marker-icon-gray.png';
          break;
      }

      var ico = glyphIcon({
        className: 'xolonium',
        glyph: acronym[0][0] + acronym[1][0],
        iconUrl: ico_url
      });
      
      var marker = new Marker([node.coordinates[0], node.coordinates[1]], {title: node.name, icon: ico});
      if (nodeType == this.selectedNodeType || this.selectedNodeType == 'All') {
        marker.bindPopup(
          '<h1>' + node.name +'</h1>' +
          '<p>Coordinates: ' + node.coordinates[0].toString() + ',' +
            node.coordinates[1].toString() + '</p>'
        )
        marker.on('click', () => {
          this.selectedNode = node;
          this.nodeTypes.forEach(nodeType => {
            if (nodeType._id == node.node_type_id)
              this.selectedNodeSensors = nodeType.sensors
          });
        });
        marker.addTo(this.map);
        this.markers.push(marker);
      }
    });
  }

  resetMarkers(nodeType) {
    this.selectedNodeType = nodeType;
    this.markers.forEach(marker => {
      marker.removeFrom(this.map);
    });
    this.markers = [];
    this.setMarkers();
  }

}

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.component.html',
})

export class Dialog {
  constructor(
    public dialogRef: MatDialogRef<Dialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}