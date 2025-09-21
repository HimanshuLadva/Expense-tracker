import { Injectable, InjectionToken, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';

export interface DialogConfig {
  title?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  data?: any;
  disableClose?: boolean;
}

export const DIALOG_DATA = new InjectionToken<any>('DialogData');

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(Dialog);

  open(component: any, config: DialogConfig = {}) {
    const dialogConfig = {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      ...config
    };

    return this.dialog.open(component, {
      width: dialogConfig.width,
      maxWidth: dialogConfig.maxWidth,
      maxHeight: dialogConfig.maxHeight,
      disableClose: dialogConfig.disableClose,
      data: {
        title: dialogConfig.title,
        ...dialogConfig.data
      },
      panelClass: 'custom-dialog-panel'
    });
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}