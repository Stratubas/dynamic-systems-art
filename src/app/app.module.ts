import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { KleinGordonChainComponent } from './pages/klein-gordon-chain/klein-gordon-chain.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BinaryStarComponent } from './pages/binary-star/binary-star.component';

@NgModule({
  declarations: [
    AppComponent,
    KleinGordonChainComponent,
    WelcomeComponent,
    NotFoundComponent,
    BinaryStarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
