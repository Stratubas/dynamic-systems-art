import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface InputModalData {
  parameters: { [key: string]: string | number | boolean };
  title: string;
}

@Component({
  selector: 'app-input-modal',
  templateUrl: './input-modal.component.html',
  styleUrls: ['./input-modal.component.scss']
})
export class InputModalComponent implements OnInit {

  title: string;
  properties: string[];
  isNumber: { [property: string]: boolean } = {};

  result: any;

  constructor(
    public dialogRef: MatDialogRef<InputModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputModalData,
  ) {
    this.properties = Object.keys(data.parameters);
    this.title = data.title;
  }

  ngOnInit() {
    this.result = { ...this.data.parameters };
    for (const property of this.properties) {
      this.isNumber[property] = typeof this.result[property] === 'number';
    }
  }

  submit() {
    console.log(this.result);
    this.dialogRef.close(this.result);
  }

}
