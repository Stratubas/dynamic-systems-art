import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { KleinGordonChainComponent } from './pages/klein-gordon-chain/klein-gordon-chain.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BinaryStarComponent } from './pages/binary-star/binary-star.component';
import { InputModalComponent } from './shared/components/input-modal/input-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    AppComponent,
    KleinGordonChainComponent,
    WelcomeComponent,
    NotFoundComponent,
    BinaryStarComponent,
    InputModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [InputModalComponent],
})
export class AppModule { }
