import { Component, OnInit } from '@angular/core';
import { SimpleModalComponent } from 'ngx-simple-modal';

@Component({
  selector: 'app-input-modal',
  templateUrl: './input-modal.component.html',
  styleUrls: ['./input-modal.component.scss']
})
export class InputModalComponent extends SimpleModalComponent<{ data: any }, any> implements OnInit {

  properties = ['from', 'to', 'step'];

  data: any;
  constructor() {
    super();
  }

  ngOnInit() {
    this.result = { ...this.data };
  }

  submit() {
    this.close();
  }

}
