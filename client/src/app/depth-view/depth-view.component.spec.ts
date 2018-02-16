import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepthViewComponent } from './depth-view.component';

describe('DepthViewComponent', () => {
  let component: DepthViewComponent;
  let fixture: ComponentFixture<DepthViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
