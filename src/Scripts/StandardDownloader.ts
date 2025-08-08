import { checkObject, convertToArray, convertToCsv, globalSettings } from "./ConvertToCsv";
import DownloadFile from "./DownloadFile";

/**
 * Download or copy the inner cell content, if the user wants so
 * @param item the object that should be downloaded (or copied) if a table cell clicked
 * @param sourceFileName the file name of the file that is being analyzed
 */
export default function standardDownloader(item: any, sourceFileName: string,) {
  if (globalSettings.downloadWhenClicked === 0) return; // The user doesn't want to do anything
  /**
   * If true, the item should be copied/downloaded as a string, since there's no object
   */
  const shouldBeOnlyString = typeof item !== "object";
  const text = shouldBeOnlyString ? String(item) : globalSettings.exportAsCsv ? convertToCsv(convertToArray(structuredClone([item]))) : JSON.stringify(structuredClone(item), (key, value) => {
    if (typeof value === "object") return checkObject(value);
    return value;
  });
  const blob = new Blob([text]);
  if (globalSettings.downloadWhenClicked === 1) { // Download item
    const downloader = new DownloadFile(); // Here we can avoid waiting the promise since zipjs will never be loaded
    downloader.add(blob, `${sourceFileName.substring(0, sourceFileName.lastIndexOf("."))}.${shouldBeOnlyString ? "txt" : globalSettings.exportAsCsv ? "csv" : "json"}`);
  } else if (globalSettings.downloadWhenClicked === 2) { // Copy the text ot the clipboard
    navigator.clipboard.writeText(text);
  }
}
