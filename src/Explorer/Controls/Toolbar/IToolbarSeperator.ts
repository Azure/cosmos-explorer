/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

interface IToolbarSeperator {
  type: "separator";
  visible: ko.Observable<boolean>;
}

export default IToolbarSeperator;
