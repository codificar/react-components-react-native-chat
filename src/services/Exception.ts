import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";

const params = `?version_code=${VersionNumber.appVersion}&version_os=${Platform.OS
  }_${Platform.Version}&error=`;
const appTypeUri = `/api/lib/rn-log-error${params}`;

export const handlerException = (baseUrl: string, projectName?: string, origin?: string, error?: any): void => {
  let errorReport = String(error) + ' ' + error.stack;

  try {
    fetch(`${baseUrl}${appTypeUri}${errorReport}&app=${projectName}&origin=${origin}&native=false`);
  } catch (error) {
    console.log("handlerException", error);
  }
}
