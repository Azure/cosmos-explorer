/* *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

// Typing for the jQuery library

/*
    Interface for the AJAX setting that will configure the AJAX request
*/
interface JQueryAjaxSettings<T> {
  accepts?: any;
  async?: boolean;
  beforeSend?(jqXHR: JQueryXHR<T>, settings: JQueryAjaxSettings<T>): boolean;
  cache?: boolean;
  complete?(jqXHR: JQueryXHR<T>, textStatus: string): any;
  contents?: { [key: string]: any };
  // JQuery in the code compares contentType with a boolean value false
  // to check, whether to add default "Content-Type" or not.
  // Correct use:
  // contentType: "text/plain"
  // contentType: false
  contentType?: any;
  context?: any;
  converters?: { [key: string]: any };
  crossDomain?: boolean;
  data?: any;
  dataFilter?(data: any, ty: any): any;
  dataType?: string;
  error?(jqXHR: JQueryXHR<T>, textStatus: string, errorThrow: string): any;
  global?: boolean;
  headers?: { [key: string]: any };
  ifModified?: boolean;
  isLocal?: boolean;
  jsonp?: string;
  jsonpCallback?: any;
  mimeType?: string;
  password?: string;
  processData?: boolean;
  scriptCharset?: string;
  statusCode?: { [key: string]: any };
  success?(data: any, textStatus: string, jqXHR: JQueryXHR<T>): void;
  timeout?: number;
  traditional?: boolean;
  type?: string;
  url?: string;
  username?: string;
  xhr?: any;
  xhrFields?: { [key: string]: any };
}

interface JQueryPromiseXHRDoneCallback<T> {
  (data: T, textStatus: string, jqXHR: JQueryXHR<T>): void;
}

interface JQueryPromiseXHRFailCallback<T> {
  (jqXHR: JQueryXHR<T>, textStatus: string, errorThrown: any): void;
}

/*
    Interface for the jqXHR object
*/
interface JQueryXHR<T> extends XMLHttpRequest {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryXHR<T>;
  done(...doneCallbacks: Array<JQueryPromiseXHRDoneCallback<T>>): JQueryXHR<T>;
  fail(...failCallbacks: Array<JQueryPromiseXHRFailCallback<T>>): JQueryXHR<T>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryXHR<T>;
  state(): string;
  promise(target?: any): JQueryXHR<T>;
  then(
    doneCallbacks: JQueryPromiseXHRDoneCallback<T>,
    failCallbacks?: JQueryPromiseXHRFailCallback<T>,
    progressCallbacks?: { (): void },
  ): JQueryPromise;

  then<UValue>(
    doneCallbacks: { (data: T, textStatus: string, jqXHR: JQueryXHR<T>): UValue },
    failCallbacks?: JQueryPromiseXHRFailCallback<T>,
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UValue, UReject>(
    doneCallbacks: { (data: T, textStatus: string, jqXHR: JQueryXHR<T>): UValue },
    failCallbacks?: { (data: T, textStatus: string, jqXHR: JQueryXHR<T>): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  then<UReject>(
    doneCallbacks: JQueryPromiseXHRDoneCallback<T>,
    failCallbacks?: { (data: T, textStatus: string, jqXHR: JQueryXHR<T>): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  overrideMimeType(mimeType: string): void;
  abort(statusText?: string): void;
}

/*
    Interface for the JQuery callback
*/
interface JQueryCallback {
  add(...callbacks: Array<{ (): void }>): JQueryCallback;
  add(callbacks: Array<{ (): void }>): JQueryCallback;
  disable(): JQueryCallback;
  disabled(): boolean;
  empty(): JQueryCallback;
  fire(): JQueryCallback;
  fired(): boolean;
  fireWith(context: any): JQueryCallback;
  has(callback: { (): void }): boolean;
  lock(): JQueryCallback;
  locked(): boolean;
  remove(...callbacks: Array<{ (): void }>): JQueryCallback;
  remove(callbacks: Array<{ (): void }>): JQueryCallback;
}

interface JQueryCallback1<T> {
  add(...callbacks: Array<{ (arg: T): void }>): JQueryCallback1<T>;
  add(callbacks: Array<{ (arg: T): void }>): JQueryCallback1<T>;
  disable(): JQueryCallback1<T>;
  disabled(): boolean;
  empty(): JQueryCallback1<T>;
  fire(arg: T): JQueryCallback1<T>;
  fired(): boolean;
  fireWith(context: any, args: any[]): JQueryCallback1<T>;
  has(callback: { (arg: T): void }): boolean;
  lock(): JQueryCallback1<T>;
  locked(): boolean;
  remove(...callbacks: Array<{ (arg: T): void }>): JQueryCallback1<T>;
  remove(callbacks: Array<{ (arg: T): void }>): JQueryCallback1<T>;
}

interface JQueryCallback2<T1, T2> {
  add(...callbacks: Array<{ (arg1: T1, arg2: T2): void }>): JQueryCallback2<T1, T2>;
  add(callbacks: Array<{ (arg1: T1, arg2: T2): void }>): JQueryCallback2<T1, T2>;
  disable(): JQueryCallback2<T1, T2>;
  disabled(): boolean;
  empty(): JQueryCallback2<T1, T2>;
  fire(arg1: T1, arg2: T2): JQueryCallback2<T1, T2>;
  fired(): boolean;
  fireWith(context: any, args: any[]): JQueryCallback2<T1, T2>;
  has(callback: { (arg1: T1, arg2: T2): void }): boolean;
  lock(): JQueryCallback2<T1, T2>;
  locked(): boolean;
  remove(...callbacks: Array<{ (arg1: T1, arg2: T2): void }>): JQueryCallback2<T1, T2>;
  remove(callbacks: Array<{ (arg1: T1, arg2: T2): void }>): JQueryCallback2<T1, T2>;
}

interface JQueryCallback3<T1, T2, T3> {
  add(...callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3): void }>): JQueryCallback3<T1, T2, T3>;
  add(callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3): void }>): JQueryCallback3<T1, T2, T3>;
  disable(): JQueryCallback3<T1, T2, T3>;
  disabled(): boolean;
  empty(): JQueryCallback3<T1, T2, T3>;
  fire(arg1: T1, arg2: T2, arg3: T3): JQueryCallback3<T1, T2, T3>;
  fired(): boolean;
  fireWith(context: any, args: any[]): JQueryCallback3<T1, T2, T3>;
  has(callback: { (arg1: T1, arg2: T2, arg3: T3): void }): boolean;
  lock(): JQueryCallback3<T1, T2, T3>;
  locked(): boolean;
  remove(...callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3): void }>): JQueryCallback3<T1, T2, T3>;
  remove(callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3): void }>): JQueryCallback3<T1, T2, T3>;
}

interface JQueryCallback4<T1, T2, T3, T4> {
  add(...callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3, arg4: T4): void }>): JQueryCallback4<T1, T2, T3, T4>;
  add(callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3, arg4: T4): void }>): JQueryCallback4<T1, T2, T3, T4>;
  disable(): JQueryCallback4<T1, T2, T3, T4>;
  disabled(): boolean;
  empty(): JQueryCallback4<T1, T2, T3, T4>;
  fire(arg1: T1, arg2: T2, arg3: T3, arg4: T4): JQueryCallback4<T1, T2, T3, T4>;
  fired(): boolean;
  fireWith(context: any, args: any[]): JQueryCallback4<T1, T2, T3, T4>;
  has(callback: { (arg1: T1, arg2: T2, arg3: T3, arg4: T4): void }): boolean;
  lock(): JQueryCallback4<T1, T2, T3, T4>;
  locked(): boolean;
  remove(...callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3, arg4: T4): void }>): JQueryCallback4<T1, T2, T3, T4>;
  remove(callbacks: Array<{ (arg1: T1, arg2: T2, arg3: T3, arg4: T4): void }>): JQueryCallback4<T1, T2, T3, T4>;
}

/*
    Interface for the JQuery promise, part of callbacks
*/
interface JQueryPromiseAny {
  always(...alwaysCallbacks: { (...args: any[]): void }[]): JQueryPromiseAny;
  done(...doneCallbacks: { (...args: any[]): void }[]): JQueryPromiseAny;
  fail(...failCallbacks: { (...args: any[]): void }[]): JQueryPromiseAny;
  progress(...progressCallbacks: { (...args: any[]): void }[]): JQueryPromiseAny;
  state(): string;
  promise(target?: any): JQueryPromiseAny;
  then(
    doneCallbacks: { (...args: any[]): any },
    failCallbacks: { (...args: any[]): any },
    progressCallbacks?: { (...args: any[]): any },
  ): JQueryPromiseAny;
}

interface JQueryPromise {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromise;
  done(...doneCallbacks: Array<{ (): void }>): JQueryPromise;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromise;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromise;
  state(): string;
  promise(target?: any): JQueryPromise;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (): JQueryPromiseV<UValue> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then(
    doneCallbacks: { (): JQueryDeferred },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;

  then(
    doneCallbacks: { (): JQueryPromise },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;

  // U Value
  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(doneCallbacks: { (): void }, failCallbacks?: { (): void }, progressCallbacks?: { (): void }): JQueryPromise;
}

interface JQueryPromiseV<TValue> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseV<TValue>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryPromiseV<TValue>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromiseV<TValue>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromiseV<TValue>;
  state(): string;
  promise(target?: any): JQueryPromiseV<TValue>;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredV<UValue> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseV<UValue> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryPromiseN<TNotify> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseN<TNotify>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryPromiseN<TNotify>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromiseN<TNotify>;
  progress(...progressCallbacks: Array<{ (arg: TNotify): void }>): JQueryPromiseN<TNotify>;
  state(): string;
  promise(target?: any): JQueryPromiseN<TNotify>;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then(
    doneCallbacks: { (): JQueryDeferredN<TNotify> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseN<TNotify>;

  then(
    doneCallbacks: { (): JQueryPromiseN<TNotify> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseN<TNotify>;

  // U Value
  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromise;
}

interface JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  progress(
    ...progressCallbacks: Array<{ (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void }>
  ): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  state(): string;
  promise(target?: any): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseVR<UValue, UReject>;

  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromise;
}

interface JQueryPromiseVV<TValue1, TValue2> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseVV<TValue1, TValue2>;
  done(...doneCallbacks: Array<{ (arg1: TValue1, arg2: TValue2): void }>): JQueryPromiseVV<TValue1, TValue2>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromiseVV<TValue1, TValue2>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromiseVV<TValue1, TValue2>;
  state(): string;
  promise(target?: any): JQueryPromiseVV<TValue1, TValue2>;
  then<UValue, UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue1, UValue2>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): JQueryDeferredVV<UValue1, UValue2> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVV<UValue1, UValue2>;

  then<UValue1, UValue2>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): JQueryPromiseVV<UValue1, UValue2> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVV<UValue1, UValue2>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryPromiseVVV<TValue1, TValue2, TValue3> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  done(
    ...doneCallbacks: Array<{ (arg1: TValue1, arg2: TValue2, arg3: TValue3): void }>
  ): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  state(): string;
  promise(target?: any): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  then<UValue, UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue1, UValue2, UValue3>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): JQueryDeferredVVV<UValue1, UValue2, UValue3> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVVV<UValue1, UValue2, UValue3>;

  then<UValue1, UValue2, UValue3>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): JQueryPromiseVVV<UValue1, UValue2, UValue3> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVVV<UValue1, UValue2, UValue3>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryPromiseVR<TValue, TReject> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseVR<TValue, TReject>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryPromiseVR<TValue, TReject>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryPromiseVR<TValue, TReject>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromiseVR<TValue, TReject>;
  state(): string;
  promise(target?: any): JQueryPromiseVR<TValue, TReject>;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): JQueryPromiseVR<UValue, UReject> },
    failCallbacks?: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredVR<UValue, TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, TReject>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseVR<UValue, TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, TReject>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryPromiseVRN<TValue, TReject, TProgress> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseVRN<TValue, TReject, TProgress>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryPromiseVRN<TValue, TReject, TProgress>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryPromiseVRN<TValue, TReject, TProgress>;
  progress(...progressCallbacks: Array<{ (arg: TProgress): void }>): JQueryPromiseVRN<TValue, TReject, TProgress>;
  state(): string;
  promise(target?: any): JQueryPromiseVRN<TValue, TReject, TProgress>;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (arg: TProgress): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredVRN<UValue, TReject, TProgress> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVRN<UValue, TReject, TProgress>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseVRN<UValue, TReject, TProgress> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVRN<UValue, TReject, TProgress>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (arg: TProgress): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (arg: TProgress): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (arg: TProgress): void },
  ): JQueryPromise;
}

interface JQueryPromiseR<TReject> {
  always(...alwaysCallbacks: Array<{ (): void }>): JQueryPromiseR<TReject>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryPromiseR<TReject>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryPromiseR<TReject>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryPromiseR<TReject>;
  state(): string;
  promise(target?: any): JQueryPromiseR<TReject>;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then(
    doneCallbacks: { (): JQueryDeferredR<TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<TReject>;

  then(
    doneCallbacks: { (): JQueryPromiseR<TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<TReject>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks?: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

/*
    Interface for the JQuery deferred, part of callbacks
*/
interface JQueryDeferredAny {
  always(...alwaysCallbacks: { (...args: any[]): void }[]): JQueryDeferredAny;
  done(...doneCallbacks: { (...args: any[]): void }[]): JQueryDeferredAny;
  fail(...failCallbacks: { (...args: any[]): void }[]): JQueryDeferredAny;
  progress(...progressCallbacks: { (): void }[]): JQueryDeferredAny;
  notify(...args: any[]): JQueryDeferredAny;
  notifyWith(context: any, args: any[]): JQueryDeferredAny;
  promise(target?: any): JQueryPromiseAny;
  reject(...args: any[]): JQueryDeferredAny;
  rejectWith(context: any, args: any[]): JQueryDeferredAny;
  resolve(...args: any[]): JQueryDeferredAny;
  resolveWith(context: any, args: any[]): JQueryDeferredAny;
  state(): string;
  then(
    doneCallbacks: { (...args: any[]): any },
    failCallbacks: { (...args: any[]): any },
    progressCallbacks?: { (...args: any[]): any },
  ): JQueryDeferredAny;
}

interface JQueryDeferred {
  notify(): JQueryDeferred;
  notifyWith(context: any): JQueryDeferred;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferred;
  done(...doneCallbacks: Array<{ (): void }>): JQueryDeferred;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferred;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferred;
  promise(target?: any): JQueryPromise;
  reject(...args: Array<any>): JQueryDeferred;
  rejectWith(context: any): JQueryDeferred;
  resolve(): JQueryDeferred;
  resolveWith(context: any): JQueryDeferred;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then(
    doneCallbacks: { (): JQueryDeferred },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;

  then(
    doneCallbacks: { (): JQueryPromise },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;

  // U Value
  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(doneCallbacks: { (): void }, failCallbacks?: { (): void }, progressCallbacks?: { (): void }): JQueryPromise;
}

interface JQueryDeferredV<TValue> {
  notify(): JQueryDeferredV<TValue>;
  notifyWith(context: any): JQueryDeferredV<TValue>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredV<TValue>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryDeferredV<TValue>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferredV<TValue>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferredV<TValue>;
  promise(target?: any): JQueryPromiseV<TValue>;
  reject(...args: Array<any>): JQueryDeferredV<TValue>;
  rejectWith(context: any): JQueryDeferredV<TValue>;
  resolve(arg: TValue): JQueryDeferredV<TValue>;
  resolveWith(context: any, args: TValue[]): JQueryDeferredV<TValue>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredV<UValue> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseV<UValue> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryDeferredN<TNotify> {
  notify(arg: TNotify): JQueryDeferredN<TNotify>;
  notifyWith(context: any, arg: TNotify): JQueryDeferredN<TNotify>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredN<TNotify>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryDeferredN<TNotify>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferredN<TNotify>;
  progress(...progressCallbacks: Array<{ (arg: TNotify): void }>): JQueryDeferredN<TNotify>;
  promise(target?: any): JQueryPromiseN<TNotify>;
  reject(...args: Array<any>): JQueryDeferredN<TNotify>;
  rejectWith(context: any): JQueryDeferredN<TNotify>;
  resolve(): JQueryDeferredN<TNotify>;
  resolveWith(context: any): JQueryDeferredN<TNotify>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then(
    doneCallbacks: { (): JQueryDeferredN<TNotify> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseN<TNotify>;

  then(
    doneCallbacks: { (): JQueryPromiseN<TNotify> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseN<TNotify>;

  // U Value
  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromise;
}

interface JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4> {
  notify(
    arg1: TNotify1,
    arg2: TNotify2,
    arg3: TNotify3,
    arg4: TNotify4,
  ): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  notifyWith(
    context: any,
    arg1: TNotify1,
    arg2: TNotify2,
    arg3: TNotify3,
    arg4: TNotify4,
  ): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  progress(
    ...progressCallbacks: Array<{ (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void }>
  ): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  promise(target?: any): JQueryPromiseNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  reject(...args: Array<any>): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  rejectWith(context: any): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  resolve(): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify2, TNotify4>;
  resolveWith(context: any): JQueryDeferredNNNN<TNotify1, TNotify2, TNotify3, TNotify4>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseVR<UValue, UReject>;

  then<UValue>(
    doneCallbacks: { (): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (arg1: TNotify1, arg2: TNotify2, arg3: TNotify3, arg4: TNotify4): void },
  ): JQueryPromise;
}

interface JQueryDeferredVV<TValue1, TValue2> {
  notify(): JQueryDeferredVV<TValue1, TValue2>;
  notifyWith(context: any): JQueryDeferredVV<TValue1, TValue2>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredVV<TValue1, TValue2>;
  done(...doneCallbacks: Array<{ (arg1: TValue1, arg2: TValue2): void }>): JQueryDeferredVV<TValue1, TValue2>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferredVV<TValue1, TValue2>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferredVV<TValue1, TValue2>;
  promise(target?: any): JQueryPromiseVV<TValue1, TValue2>;
  reject(...args: Array<any>): JQueryDeferredVV<TValue1, TValue2>;
  rejectWith(context: any): JQueryDeferredVV<TValue1, TValue2>;
  resolve(arg1: TValue1, arg2: TValue2): JQueryDeferredVV<TValue1, TValue2>;
  resolveWith(context: any, args: any[]): JQueryDeferredVV<TValue1, TValue2>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): UValue },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue1, UValue2>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): JQueryDeferredVV<UValue1, UValue2> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVV<UValue1, UValue2>;

  then<UValue1, UValue2>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): JQueryPromiseVV<UValue1, UValue2> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVV<UValue1, UValue2>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): void },
    failCallbacks: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryDeferredVVV<TValue1, TValue2, TValue3> {
  notify(): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  notifyWith(context: any): JQueryDeferredVVV<TValue1, TValue2, TValue3>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  done(
    ...doneCallbacks: Array<{ (arg1: TValue1, arg2: TValue2, arg3: TValue3): void }>
  ): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  fail(...failCallbacks: Array<{ (): void }>): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  promise(target?: any): JQueryPromiseVVV<TValue1, TValue2, TValue3>;
  reject(...args: Array<any>): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  rejectWith(context: any): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  resolve(arg1: TValue1, arg2: TValue2, arg3: TValue3): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  resolveWith(context: any, args: any[]): JQueryDeferredVVV<TValue1, TValue2, TValue3>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): UValue },
    failCallbacks?: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue1, UValue2, UValue3>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): JQueryDeferredVVV<UValue1, UValue2, UValue3> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVVV<UValue1, UValue2, UValue3>;

  then<UValue1, UValue2, UValue3>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): JQueryPromiseVVV<UValue1, UValue2, UValue3> },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVVV<UValue1, UValue2, UValue3>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): UValue },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): void },
    failCallbacks?: { (): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg1: TValue1, arg2: TValue2, arg3: TValue3): void },
    failCallbacks?: { (): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryDeferredVR<TValue, TReject> {
  notify(): JQueryDeferredVR<TValue, TReject>;
  notifyWith(context: any): JQueryDeferredVR<TValue, TReject>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredVR<TValue, TReject>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryDeferredVR<TValue, TReject>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryDeferredVR<TValue, TReject>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferredVR<TValue, TReject>;
  promise(target?: any): JQueryPromiseVR<TValue, TReject>;
  reject(arg: TReject): JQueryDeferredVR<TValue, TReject>;
  rejectWith(context: any, arg: TReject[]): JQueryDeferredVR<TValue, TReject>;
  resolve(arg: TValue): JQueryDeferredVR<TValue, TReject>;
  resolveWith(context: any, args: TValue[]): JQueryDeferredVR<TValue, TReject>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredVR<UValue, TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, TReject>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseVR<UValue, TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, TReject>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

interface JQueryDeferredVRN<TValue, TReject, TNotify> {
  notify(arg: TNotify): JQueryDeferredVR<TValue, TReject>;
  notifyWith(context: any, arg: TNotify): JQueryDeferredVR<TValue, TReject>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredVR<TValue, TReject>;
  done(...doneCallbacks: Array<{ (arg: TValue): void }>): JQueryDeferredVR<TValue, TReject>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryDeferredVR<TValue, TReject>;
  progress(...progressCallbacks: Array<{ (arg: TNotify): void }>): JQueryDeferredVR<TValue, TReject>;
  promise(target?: any): JQueryPromiseVRN<TValue, TReject, TNotify>;
  reject(arg: TReject): JQueryDeferredVR<TValue, TReject>;
  rejectWith(context: any, args: TReject[]): JQueryDeferredVR<TValue, TReject>;
  resolve(arg: TValue): JQueryDeferredVR<TValue, TReject>;
  resolveWith(context: any, args: TValue[]): JQueryDeferredVR<TValue, TReject>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryDeferredVRN<UValue, TReject, TNotify> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVRN<UValue, TReject, TNotify>;

  then<UValue>(
    doneCallbacks: { (arg: TValue): JQueryPromiseVRN<UValue, TReject, TNotify> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVRN<UValue, TReject, TNotify>;

  // U Value
  then<UValue>(
    doneCallbacks: { (arg: TValue): UValue },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseV<UValue>;

  then<UReject>(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (arg: TValue): void },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (arg: TNotify): void },
  ): JQueryPromise;
}

interface JQueryDeferredR<TReject> {
  notify(): JQueryDeferredR<TReject>;
  notifyWith(context: any): JQueryDeferredR<TReject>;

  always(...alwaysCallbacks: Array<{ (): void }>): JQueryDeferredR<TReject>;
  done(...doneCallbacks: Array<{ (): void }>): JQueryDeferredR<TReject>;
  fail(...failCallbacks: Array<{ (arg: TReject): void }>): JQueryDeferredR<TReject>;
  progress(...progressCallbacks: Array<{ (): void }>): JQueryDeferredR<TReject>;
  promise(target?: any): JQueryPromiseR<TReject>;
  reject(arg: TReject): JQueryDeferredR<TReject>;
  rejectWith(context: any, args: TReject[]): JQueryDeferredR<TReject>;
  resolve(): JQueryDeferredR<TReject>;
  resolveWith(context: any): JQueryDeferredR<TReject>;
  state(): string;
  then<UValue, UReject>(
    doneCallbacks: { (): UValue },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseVR<UValue, UReject>;

  // U Pipe
  then(
    doneCallbacks: { (): JQueryDeferredR<TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<TReject>;

  then(
    doneCallbacks: { (): JQueryPromiseR<TReject> },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<TReject>;

  then<UReject>(
    doneCallbacks: { (): void },
    failCallbacks: { (arg: TReject): UReject },
    progressCallbacks?: { (): void },
  ): JQueryPromiseR<UReject>;

  then(
    doneCallbacks: { (): void },
    failCallbacks?: { (arg: TReject): void },
    progressCallbacks?: { (): void },
  ): JQueryPromise;
}

/*
    Interface of the JQuery extension of the W3C event object
*/
interface BaseJQueryEventObject extends Event {
  data: any;
  delegateTarget: Element;
  isDefaultPrevented(): boolean;
  isImmediatePropagationStopped(): boolean;
  isPropagationStopped(): boolean;
  originalEvent: Event;
  namespace: string;
  preventDefault(): any;
  relatedTarget: Element;
  result: any;
  stopImmediatePropagation(): void;
  stopPropagation(): void;
  pageX: number;
  pageY: number;
  which: number;

  // Other possible values
  cancellable?: boolean;
  // detail ??
  prevValue?: any;
  view?: Window;
}

interface JQueryInputEventObject extends BaseJQueryEventObject {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

interface JQueryMouseEventObject extends JQueryInputEventObject {
  button: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}

interface JQueryKeyEventObject extends JQueryInputEventObject {
  char: any;
  charCode: number;
  key: any;
  keyCode: number;
}

interface JQueryEventObject
  extends BaseJQueryEventObject,
    JQueryInputEventObject,
    JQueryMouseEventObject,
    JQueryKeyEventObject {}

interface JQueryEventHandler {
  (eventObject: JQueryEventObject, args?: any): any;
}

interface JQuerySupport {
  ajax?: boolean;
  boxModel?: boolean;
  changeBubbles?: boolean;
  checkClone?: boolean;
  checkOn?: boolean;
  cors?: boolean;
  cssFloat?: boolean;
  hrefNormalized?: boolean;
  htmlSerialize?: boolean;
  leadingWhitespace?: boolean;
  noCloneChecked?: boolean;
  noCloneEvent?: boolean;
  opacity?: boolean;
  optDisabled?: boolean;
  optSelected?: boolean;
  scriptEval?(): boolean;
  style?: boolean;
  submitBubbles?: boolean;
  tbody?: boolean;
}

// TODO jsgoupil fix signature
interface JQueryEventStatic {
  fix(evt: any): any;
}

interface JQueryParam {
  (obj: any): string;
  (obj: any, traditional: boolean): string;
}

/**
 * This is a private type. It exists for type checking. Do not explicitly declare an identifier with this type.
 */
interface _JQueryDeferred {
  resolve: Function;
  resolveWith: Function;
  reject: Function;
  rejectWith: Function;
}

interface JQueryWhen {
  <T1, T2>(promise1: JQueryPromiseV<T1>, promise2: JQueryPromiseV<T2>): JQueryPromiseVV<T1, T2>;
  <T1, T2, T3>(
    promise1: JQueryPromiseV<T1>,
    promise2: JQueryPromiseV<T2>,
    promise3: JQueryPromiseV<T3>,
  ): JQueryPromiseVVV<T1, T2, T3>;
  (...deferreds: JQueryPromise[]): JQueryPromise;
  apply($: JQueryStatic, deferreds: JQueryPromise[]): JQueryPromise;
}

/*
    Static members of jQuery (those on $ and jQuery themselves)
*/
interface JQueryStatic {
  /****
     AJAX
    *****/
  ajax<T>(settings: JQueryAjaxSettings<T>): JQueryXHR<T>;
  ajax<T>(url: string, settings?: JQueryAjaxSettings<T>): JQueryXHR<T>;

  ajaxPrefilter(dataTypes: string, handler: (opts: any, originalOpts: any, jqXHR: JQueryXHR<any>) => any): any;
  ajaxPrefilter(handler: (opts: any, originalOpts: any, jqXHR: JQueryXHR<any>) => any): any;

  ajaxSettings: JQueryAjaxSettings<any>;

  ajaxSetup(options: JQueryAjaxSettings<any>): void;

  ajaxTransport<T>(
    dataType: string,
    handler: (
      options: JQueryAjaxSettings<T>,
      originalOptions: JQueryAjaxSettings<T>,
      jqXHR: JQueryXHR<T>,
    ) => JQueryTransport,
  ): any;

  get<T>(url: string, data?: any, success?: any, dataType?: any): JQueryXHR<T>;
  getJSON<T>(url: string, data?: any, success?: any): JQueryXHR<T>;
  getScript<T>(url: string, success?: any): JQueryXHR<T>;

  param: JQueryParam;

  post<T>(url: string, data?: any, success?: any, dataType?: any): JQueryXHR<T>;

  /*********
     CALLBACKS
    **********/
  Callbacks(flags?: string): JQueryCallback;
  Callbacks<T>(flags?: string): JQueryCallback1<T>;
  Callbacks<T1, T2>(flags?: string): JQueryCallback2<T1, T2>;
  Callbacks<T1, T2, T3>(flags?: string): JQueryCallback3<T1, T2, T3>;
  Callbacks<T1, T2, T3, T4>(flags?: string): JQueryCallback4<T1, T2, T3, T4>;

  /****
     CORE
    *****/
  holdReady(hold: boolean): any;

  (selector: string, context?: any): JQuery;
  (element: Element): JQuery;
  (object: {}): JQuery;
  (elementArray: Element[]): JQuery;
  (object: JQuery): JQuery;
  (func: Function): JQuery;
  (array: any[]): JQuery;
  (): JQuery;

  noConflict(removeAll?: boolean): Object;

  when: JQueryWhen;

  /***
     CSS
    ****/
  css(e: any, propertyName: string, value?: any): JQuery;
  css(e: any, propertyName: any, value?: any): JQuery;
  cssHooks: { [key: string]: any };
  cssNumber: any;

  /****
     DATA
    *****/
  data(element: Document, key?: string, value?: any): any;
  data(element: Element, key: string, value: any): any;
  data(element: Element, key: string): any;
  data(element: Element): any;

  dequeue(element: Element, queueName?: string): any;

  hasData(element: Element): boolean;

  queue(element: Element, queueName?: string): any[];
  queue(element: Element, queueName: string, newQueueOrCallback: any): JQuery;

  removeData(element: Document, name?: string): JQuery;
  removeData(element: Element, name?: string): JQuery;

  /*******
     EFFECTS
    ********/
  fx: {
    tick: () => void;
    interval: number;
    stop: () => void;
    speeds: { slow: number; fast: number };
    off: boolean;
    step: any;
  };

  /******
     EVENTS
    *******/
  proxy(fn: (...args: any[]) => any, context: any, ...args: any[]): any;
  proxy(context: any, name: string, ...args: any[]): any;
  Deferred: {
    (fn?: (d: JQueryDeferred) => void): JQueryDeferred;
    new (fn?: (d: JQueryDeferred) => void): JQueryDeferred;

    // Can't use a constraint against JQueryDeferred because the non-generic JQueryDeferred.resolve is not a base type of
    // the generic JQueryDeferred.resolve methods.
    <TDeferred extends _JQueryDeferred>(fn?: (d: TDeferred) => void): TDeferred;
    new <TDeferred extends _JQueryDeferred>(fn?: (d: TDeferred) => void): TDeferred;
  };
  Event(name: string, eventProperties?: any): JQueryEventObject;
  Event(evt: JQueryEventObject, eventProperties?: any): JQueryEventObject;

  event: JQueryEventStatic;

  /*********
     INTERNALS
    **********/
  error(message: any): JQuery;

  /*************
     MISCELLANEOUS
    **************/
  expr: any;
  fn: JQuery;
  isReady: boolean;

  /**********
     PROPERTIES
    ***********/
  support: JQuerySupport;

  /*********
     UTILITIES
    **********/
  contains(container: Element, contained: Element): boolean;

  each(collection: any, callback: (indexInArray: any, valueOfElement: any) => any): any;
  each(collection: JQuery, callback: (indexInArray: number, valueOfElement: HTMLElement) => any): JQuery;
  each<T>(collection: T[], callback: (indexInArray: number, valueOfElement: T) => void): T[];

  extend(deep: boolean, target: any, ...objs: any[]): any;
  extend(target: any, ...objs: any[]): any;

  globalEval(code: string): any;

  grep<T>(array: T[], func: (elementOfArray: T, indexInArray: number) => boolean, invert?: boolean): T[];

  inArray<T>(value: T, array: T[], fromIndex?: number): number;

  isArray(obj: any): boolean;
  isEmptyObject(obj: any): boolean;
  isFunction(obj: any): boolean;
  isNumeric(value: any): boolean;
  isPlainObject(obj: any): boolean;
  isWindow(obj: any): boolean;
  isXMLDoc(node: Node): boolean;

  makeArray(obj: any): any[];

  map<T, U>(array: T[], callback: (elementOfArray: T, indexInArray: number) => U): U[];
  map<T, U>(object: { [item: string]: T }, callback: (elementOfArray: T, indexInArray: string) => U): U[];
  map(array: any, callback: (elementOfArray: any, indexInArray: any) => any): any;

  merge<T>(first: T[], second: T[]): T[];

  noop(): any;

  now(): number;

  parseHTML(data: string, context?: Element, keepScripts?: boolean): Element[];

  parseJSON(json: string): Object;

  //FIXME: This should return an XMLDocument
  parseXML(data: string): any;

  trim(str: string): string;

  type(obj: any): string;

  unique<T>(arr: T[]): T[];
}

interface JQueryTransport {
  send(
    headers: { [index: string]: string },
    completeCallback: (
      status: number,
      statusText: string,
      responses?: { [dataType: string]: any },
      headers?: string,
    ) => any,
  ): any;
  abort(): any;
}

/*
    The jQuery instance members
*/
interface JQuery {
  /****
     AJAX
    *****/
  ajaxComplete(handler: any): JQuery;
  ajaxError(handler: (event: any, jqXHR: any, settings: any, exception: any) => any): JQuery;
  ajaxSend(handler: (event: any, jqXHR: any, settings: any, exception: any) => any): JQuery;
  ajaxStart(handler: () => any): JQuery;
  ajaxStop(handler: () => any): JQuery;
  ajaxSuccess(handler: (event: any, jqXHR: any, settings: any, exception: any) => any): JQuery;

  load(url: string, data?: any, complete?: any): JQuery;

  serialize(): string;
  serializeArray(): any[];

  /**********
     ATTRIBUTES
    ***********/
  addClass(classNames: string): JQuery;
  addClass(func: (index: any, currentClass: any) => string): JQuery;

  // http://api.jquery.com/addBack/
  addBack(selector?: string): JQuery;

  attr(attributeName: string): string;
  attr(attributeName: string, value: any): JQuery;
  attr(map: { [key: string]: any }): JQuery;
  attr(attributeName: string, func: (index: any, attr: any) => any): JQuery;

  hasClass(className: string): boolean;

  html(): string;
  html(htmlString: number): JQuery;
  html(htmlString: string): JQuery;
  html(htmlContent: (index: number, oldhtml: string) => string): JQuery;

  prop(propertyName: string): any;
  prop(propertyName: string, value: any): JQuery;
  prop(map: any): JQuery;
  prop(propertyName: string, func: (index: any, oldPropertyValue: any) => any): JQuery;

  removeAttr(attributeName: any): JQuery;

  removeClass(className?: any): JQuery;
  removeClass(func: (index: any, cls: any) => any): JQuery;

  removeProp(propertyName: any): JQuery;

  toggleClass(className: any, swtch?: boolean): JQuery;
  toggleClass(swtch?: boolean): JQuery;
  toggleClass(func: (index: any, cls: any, swtch: any) => any): JQuery;

  val(): any;
  val(value: string[]): JQuery;
  val(value: string): JQuery;
  val(value: number): JQuery;
  val(func: (index: any, value: any) => any): JQuery;

  /***
     CSS
    ****/
  css(propertyName: string): string;
  css(propertyNames: string[]): string;
  css(properties: any): JQuery;
  css(propertyName: string, value: any): JQuery;
  css(propertyName: any, value: any): JQuery;

  height(): number;
  height(value: number): JQuery;
  height(value: string): JQuery;
  height(func: (index: any, height: any) => any): JQuery;

  innerHeight(): number;
  innerWidth(): number;

  offset(): { left: number; top: number };
  offset(coordinates: any): JQuery;
  offset(func: (index: any, coords: any) => any): JQuery;

  outerHeight(includeMargin?: boolean): number;
  outerWidth(includeMargin?: boolean): number;

  position(): { top: number; left: number };

  scrollLeft(): number;
  scrollLeft(value: number): JQuery;

  scrollTop(): number;
  scrollTop(value: number): JQuery;

  width(): number;
  width(value: number): JQuery;
  width(value: string): JQuery;
  width(func: (index: any, height: any) => any): JQuery;

  /****
     DATA
    *****/
  clearQueue(queueName?: string): JQuery;

  data(key: string, value: any): JQuery;
  data(obj: { [key: string]: any }): JQuery;
  data(key?: string): any;

  dequeue(queueName?: string): JQuery;

  removeData(nameOrList?: any): JQuery;

  /********
     DEFERRED
    *********/
  promise(type?: any, target?: any): JQueryPromise;

  /*******
     EFFECTS
    ********/
  animate(properties: any, duration?: any, complete?: Function): JQuery;
  animate(properties: any, duration?: any, easing?: string, complete?: Function): JQuery;
  animate(
    properties: any,
    options: {
      duration?: any;
      easing?: string;
      complete?: Function;
      step?: Function;
      queue?: boolean;
      specialEasing?: any;
    },
  ): JQuery;

  delay(duration: number, queueName?: string): JQuery;

  fadeIn(duration?: any, callback?: any): JQuery;
  fadeIn(duration?: any, easing?: string, callback?: any): JQuery;

  fadeOut(duration?: any, callback?: any): JQuery;
  fadeOut(duration?: any, easing?: string, callback?: any): JQuery;

  fadeTo(duration: any, opacity: number, callback?: any): JQuery;
  fadeTo(duration: any, opacity: number, easing?: string, callback?: any): JQuery;

  fadeToggle(duration?: any, callback?: any): JQuery;
  fadeToggle(duration?: any, easing?: string, callback?: any): JQuery;

  finish(): JQuery;

  hide(duration?: any, callback?: any): JQuery;
  hide(duration?: any, easing?: string, callback?: any): JQuery;

  show(duration?: any, callback?: any): JQuery;
  show(duration?: any, easing?: string, callback?: any): JQuery;

  slideDown(duration?: any, callback?: any): JQuery;
  slideDown(duration?: any, easing?: string, callback?: any): JQuery;

  slideToggle(duration?: any, callback?: any): JQuery;
  slideToggle(duration?: any, easing?: string, callback?: any): JQuery;

  slideUp(duration?: any, callback?: any): JQuery;
  slideUp(duration?: any, easing?: string, callback?: any): JQuery;

  stop(clearQueue?: boolean, jumpToEnd?: boolean): JQuery;
  stop(queue?: any, clearQueue?: boolean, jumpToEnd?: boolean): JQuery;

  toggle(duration?: any, callback?: any): JQuery;
  toggle(duration?: any, easing?: string, callback?: any): JQuery;
  toggle(showOrHide: boolean): JQuery;

  /******
     EVENTS
    *******/
  bind(eventType: string, eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  bind(eventType: string, eventData: any, preventBubble: boolean): JQuery;
  bind(eventType: string, preventBubble: boolean): JQuery;
  bind(...events: any[]): JQuery;

  blur(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  blur(handler: (eventObject: JQueryEventObject) => any): JQuery;

  change(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  change(handler: (eventObject: JQueryEventObject) => any): JQuery;

  click(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  click(handler: (eventObject: JQueryEventObject) => any): JQuery;

  dblclick(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  dblclick(handler: (eventObject: JQueryEventObject) => any): JQuery;

  delegate(selector: any, eventType: string, handler: (eventObject: JQueryEventObject) => any): JQuery;

  focus(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  focus(handler: (eventObject: JQueryEventObject) => any): JQuery;

  focusin(eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;
  focusin(handler: (eventObject: JQueryEventObject) => any): JQuery;

  focusout(eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;
  focusout(handler: (eventObject: JQueryEventObject) => any): JQuery;

  hover(
    handlerIn: (eventObject: JQueryEventObject) => any,
    handlerOut: (eventObject: JQueryEventObject) => any,
  ): JQuery;
  hover(handlerInOut: (eventObject: JQueryEventObject) => any): JQuery;

  keydown(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;
  keydown(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;

  keypress(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;
  keypress(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;

  keyup(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;
  keyup(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;

  load(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  load(handler: (eventObject: JQueryEventObject) => any): JQuery;

  mousedown(): JQuery;
  mousedown(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mousedown(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseevent(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseevent(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseenter(): JQuery;
  mouseenter(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseenter(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseleave(): JQuery;
  mouseleave(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseleave(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mousemove(): JQuery;
  mousemove(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mousemove(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseout(): JQuery;
  mouseout(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseout(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseover(): JQuery;
  mouseover(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseover(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  mouseup(): JQuery;
  mouseup(eventData: any, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
  mouseup(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

  off(events?: string, selector?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  off(eventsMap: { [key: string]: any }, selector?: any): JQuery;

  on(events: string, selector: any, data: any, handler: (eventObject: JQueryEventObject, args: any) => any): JQuery;
  on(events: string, selector: any, handler: (eventObject: JQueryEventObject) => any): JQuery;
  on(events: string, handler: (eventObject: JQueryEventObject, args: any) => any): JQuery;
  on(eventsMap: { [key: string]: any }, selector?: any, data?: any): JQuery;

  one(events: string, selector?: any, data?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  one(eventsMap: { [key: string]: any }, selector?: any, data?: any): JQuery;

  ready(handler: any): JQuery;

  resize(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  resize(handler: (eventObject: JQueryEventObject) => any): JQuery;

  scroll(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  scroll(handler: (eventObject: JQueryEventObject) => any): JQuery;

  select(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  select(handler: (eventObject: JQueryEventObject) => any): JQuery;

  submit(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  submit(handler: (eventObject: JQueryEventObject) => any): JQuery;

  trigger(eventType: string, ...extraParameters: any[]): JQuery;
  trigger(event: JQueryEventObject, ...extraParameters: any[]): JQuery;

  triggerHandler(eventType: string, ...extraParameters: any[]): Object;
  // JSGOUPIL: triggerHandler uses trigger, not documented though
  triggerHandler(evt: JQueryEventObject): Object;

  unbind(eventType?: string, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  unbind(eventType: string, fls: boolean): JQuery;
  unbind(evt: any): JQuery;

  undelegate(): JQuery;
  undelegate(selector: any, eventType: string, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  undelegate(selector: any, events: any): JQuery;
  undelegate(namespace: string): JQuery;

  unload(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;
  unload(handler: (eventObject: JQueryEventObject) => any): JQuery;

  /*********
     INTERNALS
    **********/

  context: Element;
  jquery: string;

  error(handler: (eventObject: JQueryEventObject) => any): JQuery;
  error(eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;

  pushStack(elements: any[]): JQuery;
  pushStack(elements: any[], name: any, arguments: any): JQuery;

  /************
     MANIPULATION
    *************/
  after(...content: any[]): JQuery;
  after(func: (index: any) => any): JQuery;

  append(...content: any[]): JQuery;
  append(func: (index: any, html: any) => any): JQuery;

  appendTo(target: any): JQuery;

  before(...content: any[]): JQuery;
  before(func: (index: any) => any): JQuery;

  clone(withDataAndEvents?: boolean, deepWithDataAndEvents?: boolean): JQuery;

  detach(selector?: any): JQuery;

  empty(): JQuery;

  insertAfter(target: any): JQuery;
  insertBefore(target: any): JQuery;

  prepend(...content: any[]): JQuery;
  prepend(func: (index: any, html: any) => any): JQuery;

  prependTo(target: any): JQuery;

  remove(selector?: any): JQuery;

  replaceAll(target: any): JQuery;

  replaceWith(func: any): JQuery;

  text(): string;
  text(textString: any): JQuery;
  text(textString: (index: number, text: string) => string): JQuery;

  toArray(): any[];

  unwrap(): JQuery;

  wrap(wrappingElement: any): JQuery;
  wrap(func: (index: any) => any): JQuery;

  wrapAll(wrappingElement: any): JQuery;

  wrapInner(wrappingElement: any): JQuery;
  wrapInner(func: (index: any) => any): JQuery;

  /*************
     MISCELLANEOUS
    **************/
  each(func: (index: any, elem: Element) => any): JQuery;

  get(index?: number): any;

  index(): number;
  index(selector: string): number;
  index(element: any): number;

  /**********
     PROPERTIES
    ***********/
  length: number;
  selector: string;
  [x: string]: any;
  [x: number]: HTMLElement;

  /**********
     TRAVERSING
    ***********/
  add(selector: string, context?: any): JQuery;
  add(...elements: any[]): JQuery;
  add(html: string): JQuery;
  add(obj: JQuery): JQuery;

  children(selector?: any): JQuery;

  closest(selector: string): JQuery;
  closest(selector: string, context?: Element): JQuery;
  closest(obj: JQuery): JQuery;
  closest(element: any): JQuery;
  closest(selectors: any, context?: Element): any[];

  contents(): JQuery;

  end(): JQuery;

  eq(index: number): JQuery;

  filter(selector: string): JQuery;
  filter(func: (index: any) => any): JQuery;
  filter(element: any): JQuery;
  filter(obj: JQuery): JQuery;

  find(selector: string): JQuery;
  find(element: any): JQuery;
  find(obj: JQuery): JQuery;

  first(): JQuery;

  has(selector: string): JQuery;
  has(contained: Element): JQuery;

  is(selector: string): boolean;
  is(func: (index: any) => any): boolean;
  is(element: any): boolean;
  is(obj: JQuery): boolean;

  last(): JQuery;

  map(callback: (index: any, domElement: Element) => any): JQuery;

  next(selector?: string): JQuery;

  nextAll(selector?: string): JQuery;

  nextUntil(selector?: string, filter?: string): JQuery;
  nextUntil(element?: Element, filter?: string): JQuery;

  not(selector: string): JQuery;
  not(func: (index: any) => any): JQuery;
  not(element: any): JQuery;
  not(obj: JQuery): JQuery;

  offsetParent(): JQuery;

  parent(selector?: string): JQuery;

  parents(selector?: string): JQuery;

  parentsUntil(selector?: string, filter?: string): JQuery;
  parentsUntil(element?: Element, filter?: string): JQuery;

  prev(selector?: string): JQuery;

  prevAll(selector?: string): JQuery;

  prevUntil(selector?: string, filter?: string): JQuery;
  prevUntil(element?: Element, filter?: string): JQuery;

  siblings(selector?: string): JQuery;

  slice(start: number, end?: number): JQuery;

  /*********
     UTILITIES
    **********/

  queue(queueName?: string): any[];
  queue(queueName: string, newQueueOrCallback: any): JQuery;
  queue(newQueueOrCallback: any): JQuery;
}

interface EventTarget {
  //nodeName: string;  //bugfix, duplicate identifier.  see: http://stackoverflow.com/questions/14824143/duplicate-identifier-nodename-in-jquery-d-ts
}

// TODO Rmove these and make jquery a proper module
declare module "jquery";
declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;
