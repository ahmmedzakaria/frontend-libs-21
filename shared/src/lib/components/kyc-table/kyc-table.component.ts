import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Kyc } from '@app-core/services/kyc.service';
import {NgForOf, NgIf} from "@angular/common";

@Component({
    selector: 'app-kyc-table',
    imports: [
        NgForOf,
        NgIf,
    ],
    templateUrl: './kyc-table.component.html'
})
export class KycTableComponent {
  @Input() kycList: Kyc[] = [];
  @Output() edit = new EventEmitter<Kyc>();
  @Output() delete = new EventEmitter<Kyc>();

  public getPhotoUrl(kyc: Kyc): string | null {
      if (!kyc.photoString) return null;
     // console.log(kyc.photoString);
      return `data:image/jpeg;base64,${kyc.photoString}`;
  }

}
