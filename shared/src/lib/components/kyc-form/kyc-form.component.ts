import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { KycService, Kyc } from '@app-core/services/kyc.service';
import {NgIf} from "@angular/common";

@Component({
    selector: 'app-kyc-form',
    imports: [
        ReactiveFormsModule,
        NgIf
    ],
    templateUrl: './kyc-form.component.html'
})
export class KycFormComponent {
  @Input() kycData?: Kyc;
  @Output() saved = new EventEmitter<Kyc>();

  form: FormGroup;

  constructor(private fb: FormBuilder, private kycService: KycService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      photo: [null]
    });
  }

  ngOnInit() { if (this.kycData) this.form.patchValue(this.kycData); }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    this.form.patchValue({ photo: file });
    this.form.get('photo')?.markAsDirty();
  }

  submit() {
    let formData = new FormData();
    formData.append('firstName', this.form.value.name);
    formData.append('email', this.form.value.email);
    formData.append('phone', this.form.value.phone);
    formData.append('lastName', '');
    formData.append('nationalId', this.form.value.name + '-NID');

    const selectedFile = this.form.value.photo as File | null;
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    if (this.kycData?.id) {

        formData.append('id', this.kycData?.id?.toString());
      this.kycService.updateKyc(formData).subscribe(res => this.saved.emit(res));
    } else {
      this.kycService.createKyc(formData).subscribe(res => this.saved.emit(res));
    }
  }
}
