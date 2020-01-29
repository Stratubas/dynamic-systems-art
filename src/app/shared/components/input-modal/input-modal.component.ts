import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-input-modal',
  templateUrl: './input-modal.component.html',
  styleUrls: ['./input-modal.component.scss']
})
export class InputModalComponent implements OnInit {

  properties = ['from', 'to', 'step'];
  isNumber: { [property: string]: boolean } = {};

  result: any;

  constructor(
    public dialogRef: MatDialogRef<InputModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data) { }

  ngOnInit() {
    this.result = { ...this.data };
    for (const property of this.properties) {
      this.isNumber[property] = typeof this.result[property] === 'number';
    }
  }

  submit() {
    console.log(this.result);
    this.dialogRef.close(this.result);
  }

}
