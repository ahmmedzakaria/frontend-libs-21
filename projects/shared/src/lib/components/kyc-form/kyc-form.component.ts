import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Kyc } from '../../models/kyc.model';
import {NgIf} from "@angular/common";

/**
 * Presentational only: builds the FormData payload and emits it via
 * `formSubmitted` — it does not call any backend service itself. The
 * consuming app owns the actual create/update call and decides success
 * handling, since this component has no knowledge of app-specific API
 * endpoints or services.
 */
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
  @Output() formSubmitted = new EventEmitter<FormData>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
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
      formData.append('id', this.kycData.id.toString());
    }

    this.formSubmitted.emit(formData);
  }
}
