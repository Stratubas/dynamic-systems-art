import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { KleinGordonChainComponent } from './pages/klein-gordon-chain/klein-gordon-chain.component';


const routes: Routes = [
  { path: 'klein-gordon-chain', component: KleinGordonChainComponent },
  { path: '', redirectTo: '/klein-gordon-chain', pathMatch: 'full' },
  { path: '**', component: KleinGordonChainComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
