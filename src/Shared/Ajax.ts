import Q from "q";
import $ from "jquery";

export default class Ajax {
  public static head<T>(url: string): Q.Promise<any> {
    return Ajax._ajax(url, "HEAD");
  }

  public static post<T>(url: string, data?: any): Q.Promise<any> {
    return Ajax._ajax(url, "POST", data);
  }

  public static put<T>(url: string, data?: any): Q.Promise<any> {
    return Ajax._ajax(url, "PUT", data);
  }

  public static get<T>(url: string, data?: any): Q.Promise<any> {
    return Ajax._ajax(url, "GET", data);
  }

  public static Delete<T>(url: string, data?: any): Q.Promise<any> {
    return Ajax._ajax(url, "DELETE", data);
  }

  static _ajax<T>(url: string, method: string, data?: any): Q.Promise<any> {
    return Q($.ajax(url, Ajax._getNetAjaxSettings(url, method, data)));
  }

  static _getNetAjaxSettings<T>(url: string, method: string, data?: any): JQueryAjaxSettings<T> {
    var newSettings: JQueryAjaxSettings<T> = {
      url: url,
      type: method,
      cache: false,
      contentType: "application/json",
      traditional: true
    };

    if (!!data) {
      newSettings.data = typeof data === "string" ? data : JSON.stringify(data || {});
    }
    return newSettings;
  }
}
