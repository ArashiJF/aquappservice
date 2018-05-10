import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatCheckboxModule, 
         MatCardModule, MatGridListModule,
         MatDatepickerModule, MatToolbarModule, 
         MatRadioModule, MatFormFieldModule,
         MAT_DATE_LOCALE, 
         MatNativeDateModule,
         MatInputModule,
         MatSidenavModule,
         MatTableModule,
         MatIconModule, MatIconRegistry, MatExpansionModule, MatSelectModule} from '@angular/material';

import { AppComponent } from './app.component';
import { NodeSelectorComponent } from './node-selector/node-selector.component';
import { ExportSelectorComponent } from './export-selector/export-selector.component';
import { MapComponent } from './map/map.component';
import { ChartComponent } from './chart/chart.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    NodeSelectorComponent,
    ExportSelectorComponent,
    MapComponent,
    ChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatSelectModule,
    HttpClientModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-GB'},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor (iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
      'three-bar-menu',
      sanitizer.bypassSecurityTrustResourceUrl('assets/three-bar-menu.svg'));
  }
 }
