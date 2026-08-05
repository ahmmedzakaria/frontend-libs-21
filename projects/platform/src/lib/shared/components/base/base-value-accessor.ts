import { Directive, signal } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

/**
 * Shared ControlValueAccessor implementation. Every form control component
 * (Textbox, Checkbox, Dropdown, etc.) extends this instead of reimplementing
 * writeValue/registerOnChange/registerOnTouched/setDisabledState from scratch.
 *
 * `@Directive()` with no selector is required so Angular's DI/metadata
 * system treats this as injectable-by-inheritance; it's never used directly.
 */
@Directive()
export abstract class BaseValueAccessor<T> implements ControlValueAccessor {
  readonly value = signal<T | null>(null);
  readonly disabled = signal(false);

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** Call from a subclass whenever the user changes the value. */
  protected emitValue(value: T | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  /** Call from a subclass on blur (or equivalent) to mark the control touched. */
  protected markTouched(): void {
    this.onTouched();
  }
}
