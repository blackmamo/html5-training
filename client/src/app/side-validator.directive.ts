import {Directive, Input} from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator} from '@angular/forms';
import { Side } from "bitcoin-common";

@Directive({
  selector: '[validSide]',
  providers: [{provide: NG_VALIDATORS, useExisting: SideValidatorDirective, multi: true}]
})
export class SideValidatorDirective implements Validator{
  validate(control: AbstractControl): {[key: string]: any} {
    let side = Side[control.value as string];
    return (side === Side.Bid || side === Side.Offer) ? null : {'sideValid': {value: control.value}};
  }
}

@Directive({
  selector: '[minValid]',
  providers: [{provide: NG_VALIDATORS, useExisting: MinValidDirective, multi: true}]
})
export class MinValidDirective implements Validator{
  @Input('minValid') min: number;

  validate(control: AbstractControl): {[key: string]: any} {
    return (control.value < this.min) ? {'minValid': {value: control.value}} : null;
  }
}
