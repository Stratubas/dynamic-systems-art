import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KleinGordonChainComponent } from './pages/klein-gordon-chain/klein-gordon-chain.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BinaryStarComponent } from './pages/binary-star/binary-star.component';


const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'binary-star', component: BinaryStarComponent },
  { path: 'klein-gordon-chain', component: KleinGordonChainComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
