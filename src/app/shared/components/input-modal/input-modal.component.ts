import { Component, OnInit } from '@angular/core';
import { SimpleModalComponent } from 'ngx-simple-modal';

@Component({
  selector: 'app-input-modal',
  templateUrl: './input-modal.component.html',
  styleUrls: ['./input-modal.component.scss']
})
export class InputModalComponent extends SimpleModalComponent<{ data: any }, any> implements OnInit {

  properties = ['from', 'to', 'step'];
  isNumber: { [property: string]: boolean } = {};

  data: any;
  constructor() {
    super();
  }

  ngOnInit() {
    this.result = { ...this.data };
    for (const property of this.properties) {
      this.isNumber[property] = typeof this.result[property] === 'number';
    }
  }

  submit() {
    this.close();
  }

}
