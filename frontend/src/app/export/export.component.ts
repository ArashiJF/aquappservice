import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { Data } from '../sensor-data';
import { Node } from '../node';
import { NodeType } from '../node-type';
import { Sensor } from '../sensor';
import { ApiService } from '../api/api.service';
import { TranslateService } from '../translate/translate.service';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css'],
})

export class ExportComponent implements OnInit {
  /**
   * Start and end of the date range that will be used
   * to get the data from the api.
   */
  startDate: Date;
  endDate: Date;

  loading: boolean = false;

  // For the second y-axis, if any
  startDate2: Date;
  endDate2: Date;

  // Whether there is a y-axis graph or not
  comparativeGraph: boolean = false;
  
  validDates2: string[];

  data2: Data;

  exportFormat: string;  // 'csv' or 'chart'

  sensors: Sensor[];
  secondNodeId: string;
  nodes: Node[];
  nodeTypes: NodeType[];
  variable: string;

  // TODO: USE UNITS IN CSV
  unit: string;
  unit2: string;

  csv_data: string;

  /**
   * A list of dates (with granularity of one day) in
   * which there is data collected
   */
  validDates: string[];

  /**
   * The id of the node which data will be exported
   * and the variable of the sensor.
   */
  @Input() dataFromHomeComponent: string[];

  // The data that will be exported
  data: Data;

  /**
   * 
   * @param apiService The api service connects to the backend and brings information
   * about the nodes and water bodies.
   * 
   * @param dialog An Angular Material Dialog instance used to display the export-selector
   * component
   * 
   * @param snackBar An angular Material SnackBar instance used to display error messages
   * (more info at: https://material.angular.io/components/snack-bar/overview)
   * 
   * @param translateService This service translates text accross the app. (here is used
   * to translate the snackbar messages)
   * 
   * @param adapter Used to change the locale of the date pickers to match with the page
   * current language.
   */
  constructor(private apiService: ApiService, public dialog: MatDialog, public snackBar: MatSnackBar, private translateService: TranslateService, private adapter: DateAdapter<any>) { }

  /**
   * When the component is rendered the valid dates are taken from the
   * backend. This method also changes the locale depending on the language
   * of the application.
   */
  ngOnInit() {
    
    this.apiService.getNodes().subscribe(nodes => this.nodes = nodes,
      () => this.openSnackBar(this.translateService.translate("Failed to fetch the data, check your internet connection"), ""),
      () => {
        this.apiService.getNodeTypes().subscribe(nodeTypes => this.nodeTypes = nodeTypes,
          () => this.openSnackBar(this.translateService.translate("Failed to fetch the data, check your internet connection"), ""),
          () => {
            this.secondNodeId = this.nodes[0]._id;
            this.nodeTypes.forEach(nodeType => {
              if (nodeType._id == this.nodes[0].node_type_id) {
                this.sensors = nodeType.sensors;
                return;
              }
            });

            this.variable = this.sensors[0].variable;
            this.getValidDates2(this.secondNodeId, this.variable);
          }
        );
      }
    );

    this.getValidDates(this.dataFromHomeComponent[0], this.dataFromHomeComponent[1]);
    switch(this.translateService.getCurrentLanguage()) {
      case "en":
        this.adapter.setLocale("en-GB");
        break;
      case "es":
        this.adapter.setLocale("es-CO");
        break;
    }
  }

  /**
   * Get the valid dates, displayes an error message if it fails
   */
  getValidDates(_id: string, variable: string) {
    this.apiService.getValidDates(_id, variable).subscribe(validDates => this.validDates = validDates,
      () => this.openSnackBar(this.translateService.translate("Failed to fetch the data, check your internet connection"), ""));
  }

  getValidDates2(_id: string, variable: string) {
    this.apiService.getValidDates(_id, variable).subscribe(validDates => this.validDates2 = validDates,
      () => this.openSnackBar(this.translateService.translate("Failed to fetch the data, check your internet connection"), ""));
  }

  /**
   * Exports the data in csv or as a chart using dygraphs
   * (more info at http://dygraphs.com/)
   */
  export() {
    this.loading = true;
    if (this.comparativeGraph) {
      if (this.exportFormat == 'csv') {
        // Convert JSON to csv and download
        this.apiService.getCSVData2(
          this.dataFromHomeComponent[0],
          this.dataFromHomeComponent[1],
          this.startDate.toISOString(),
          this.endDate.toISOString(),
          this.secondNodeId,
          this.variable,
          this.startDate2.toISOString(),
          this.endDate2.toISOString()
        ).subscribe(csv_data => this.csv_data = csv_data, () => {},
          () => {
            var blob = new Blob([this.csv_data], {type: 'text/csv'});
            var url= window.URL.createObjectURL(blob);
            window.open(url);
            this.loading = false;
          }
        )
      } else {
        // Open popup
        this.apiService.getCSVData2(
          this.dataFromHomeComponent[0],
          this.dataFromHomeComponent[1],
          this.startDate.toISOString(),
          this.endDate.toISOString(),
          this.secondNodeId,
          this.variable,
          this.startDate2.toISOString(),
          this.endDate2.toISOString()
        ).subscribe(csv_data => this.csv_data = csv_data, () => {},
          () => {
            this.loading = false;
            this.openDialog2();
          }
        )
      }
    } else {
      if (this.exportFormat == 'csv') {
        // Convert JSON to csv and download
        this.apiService.getCSVData1(
          this.dataFromHomeComponent[0],
          this.dataFromHomeComponent[1],
          this.startDate.toISOString(),
          this.endDate.toISOString()
        ).subscribe(csv_data => this.csv_data = csv_data, () => {},
          () => {
            var blob = new Blob([this.csv_data], {type: 'text/csv'});
            var url= window.URL.createObjectURL(blob);
            window.open(url);
            this.loading = false;
          }
        )
      } else {
        // Open popup
        this.apiService.getCSVData1(
          this.dataFromHomeComponent[0],
          this.dataFromHomeComponent[1],
          this.startDate.toISOString(),
          this.endDate.toISOString()
        ).subscribe(csv_data => this.csv_data = csv_data, () => {},
          () => {
            this.loading = false;
            this.openDialog();
          }
        )
      }
    }
  }

  /**
   * Opens the Dialog instance with the data to export that
   * will be used in the ng-dygraph directive in 
   * export-selector.component.html.
   */
  openDialog(): void {
    this.dialog.open(Dialog, {
      width: '70%',
      height: '70%',
      minHeight: "300px",
      data: {
        'node_id': this.dataFromHomeComponent[0], 
        'variable': this.dataFromHomeComponent[1],
        'sensor_data': this.csv_data,
        'options': {
          'width': 1000,
          'height': 250,
          'legend': 'always',
          'axes': {
            y: {
              valueFormatter: (v) => {
                return v + this.dataFromHomeComponent[2];  // controls formatting in the legend/mouseover
              },
              axisLabelFormatter: (v) => {
                return v + this.dataFromHomeComponent[2];  // controls formatting of the y-axis labels
              }
            }
          }
        }
      }
    });
  }

  // When there's a second variable
  openDialog2(): void {
    this.unit2 = "";
    var node2: string;
    
    this.nodes.forEach(node => {
      if (node._id == this.secondNodeId) {
        node2 = node.name;
        this.nodeTypes.forEach(nodeType => {
          if (nodeType._id == node.node_type_id) {
            nodeType.sensors.forEach(sensor => {
              if (sensor.variable == this.variable) {
                this.unit2 = sensor.unit;
                return;
              }
            });
          }
        });
        return;
      }
    });

    var node1: string;
    this.nodes.forEach(node => {
      if (node._id == this.dataFromHomeComponent[0]) {
        node1 = node.name;
      }
    });
    
    this.dialog.open(Dialog, {
      width: '70%',
      height: '70%',
      minHeight: "300px",
      data: {
        'node_id': this.dataFromHomeComponent[0], 
        'variable': this.dataFromHomeComponent[1],
        'sensor_data': this.csv_data,
        'options': {
          'width': 1000,
          'height': 250,
          'legend': 'always',
          'axes': {
            x: {
                axisLabelFormatter: function (x) {
                    var aux = new Date(x);
                    return aux.toDateString();
                },
                valueFormatter: function (y) {
                    var aux = new Date(y); 
                    return aux.toISOString(); //Hide legend label
                }
            },
            y: {
              valueFormatter: (v) => {
                return v + this.dataFromHomeComponent[2];  // controls formatting in the legend/mouseover
              },
              axisLabelFormatter: (v) => {
                return v + this.dataFromHomeComponent[2];  // controls formatting of the y-axis labels
              }
            },
            y2: {
              valueFormatter: (v) => {
                return v + this.unit2;  // controls formatting in the legend/mouseover
              },
              axisLabelFormatter: (v) => {
                return v + this.unit2;  // controls formatting of the y-axis labels
              }
            }
          },
          labels: ["Date", node1, node2],
          colors: ["#007ee5ff", "#0028c0ff"]
        }
      }
    });
  }
  
  /**
   * This object was created with the sole purpose of taking
   * advantage of the TypeScript scope of the variables.
   * 
   * To filter the dates in the date pickers we need a
   * callback that checks a given date and returns
   * true if the date is valid and false if not.
   * The big problem is that the filter function needs
   * the validDates property from ExportSelectorComponent,
   * but the 'this' pointer no longers
   * points to ExportSelectorComponent but to the
   * datepicker instance, so, the solution was to
   * wrap the filter callback into this object that
   * has the validDates property from this component,
   * this way, the 'this' pointer in dateFilter refers 
   * to the filter property of this component instead 
   * of the datepicker.
   */
  filter = {
    'validDates': this.validDates,
    'dateFilter': (d: Date): boolean => {
      var date_as_string: string = (d.getMonth() + 1).toString() + "/" + d.getDate().toString() + "/" + d.getFullYear().toString();
      var result = false;
      this.validDates.forEach(valid_date => {
        if (valid_date == date_as_string) {
          result = true;
          return;
        }
      });

      return result;
    }
  }

  filter2 = {
    'validDates': this.validDates2,
    'dateFilter': (d: Date): boolean => {
      var date_as_string: string = (d.getMonth() + 1).toString() + "/" + d.getDate().toString() + "/" + d.getFullYear().toString();
      var result = false;
      this.validDates2.forEach(valid_date => {
        if (valid_date == date_as_string) {
          result = true;
          return;
        }
      });

      return result;
    }
  }

  /**
   * It opens the snackbar instance of this object and displays
   * a message (with an optional action)
   * More info at: https://material.angular.io/components/snack-bar/overview
   * 
   * @param message The message (here is used currently to display
   * error messages only) to be displayed
   * @param action The label for the snackbar action that the user 
   * can perform.
   */
  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
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

  /**
   * When the user clicks outside the bounds of the Dialog
   * if closes.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  expand() {
    this.dialogRef.updateSize("90%", "90%");
  }
  
  reduce() {
    this.dialogRef.updateSize("70%", "70%")
  }
}
