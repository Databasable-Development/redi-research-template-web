import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AGGridDatePickerCompponentComponent } from './aggrid-date-picker-compponent.component';

describe('AGGridDatePickerCompponentComponent', () => {
  let component: AGGridDatePickerCompponentComponent;
  let fixture: ComponentFixture<AGGridDatePickerCompponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AGGridDatePickerCompponentComponent]
    });
    fixture = TestBed.createComponent(AGGridDatePickerCompponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
