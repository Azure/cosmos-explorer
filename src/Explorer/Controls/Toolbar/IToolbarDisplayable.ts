/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

interface IToolbarDisplayable {
  id: string;
  title: ko.Subscribable<string>;
  displayName: ko.Subscribable<string>;
  enabled: ko.Subscribable<boolean>;
  visible: ko.Observable<boolean>;
  focused: ko.Observable<boolean>;
  icon: string;
  mouseDown: (data: any, event: MouseEvent) => any;
  keyUp: (data: any, event: KeyboardEvent) => any;
  keyDown: (data: any, event: KeyboardEvent) => any;
}

export default IToolbarDisplayable;
