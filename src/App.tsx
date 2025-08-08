import { parseBlob, type IAudioMetadata, type ICommonTagsResult } from "music-metadata";
import { useEffect, useState } from "react"
import ObjectExplorer from "./Components/ObjectExplorer";
// @ts-ignore
import "@fontsource/work-sans/400";
// @ts-ignore
import "@fontsource/work-sans/700";
import { checkObject, convertToArray, convertToCsv, globalSettings } from "./Scripts/ConvertToCsv";
import DownloadFile from "./Scripts/DownloadFile";
import HandleDroppedFiles from "./Scripts/HandleDroppedFiles";
import standardDownloader from "./Scripts/StandardDownloader";
import OpenSourceDialog from "./Components/OpenSourceDialog";



interface FileStorage {
  file: File,
  metadata: IAudioMetadata
}

declare global {
  interface File {
    _path: string
  }
  interface Window {
    version: string
  }
}

export default function App() {
  const [files, updateFiles] = useState<FileStorage[]>([]);
  const [rerender, forceReRender] = useState(0);
  const [selectedFileIndex, updateSelectedFileIndex] = useState(0);
  const [openSourceDialog, showOpenSourceDialog] = useState(false);
  function getAlbumArtBlob(metadata: ICommonTagsResult, source: File) {
    return (metadata?.picture ?? []).map((item, i, arr) => Object.assign(new File([item.data as BlobPart], "file"), { _path: `${source._path.substring(0, source._path.lastIndexOf("/") + 1)}${arr.length !== 1 ? `[${i}] ` : ""}.${source.name.substring(0, source.name.lastIndexOf(".") + 1)}${(item.format ?? "image/jpeg").substring((item.format ?? "image/jpeg").lastIndexOf("/") + 1)}` }));
  }
  async function getFileObject(file: File) {
          try {
            const metadata = await parseBlob(file);
            // @ts-ignore
            if (metadata.common) metadata.common.filename = file._path;
            return {
              file,
              metadata
            }
          } catch (ex) {
            console.warn(ex);
          }
  }
  function filePicker(directory: boolean) {
    const input = Object.assign(document.createElement("input"), {
      type: "file",
      multiple: true,
      webkitdirectory: directory, 
      directory,
      onchange: async () => {
        if (!input.files) return;
        let newArr: FileStorage[] = [];
        for (const file of input.files) {
          file._path = file.webkitRelativePath || file.name;
          const metadata = await getFileObject(file);
          metadata && newArr.push(metadata);
        }
        updateFiles(prev => [...prev, ...newArr]);
      }
    });
    input.click();
  }
  /**
   * Change between light and dark theme
   * @param update if the theme should be switched in the `globalSettings`
   */
  function changeTheme(update = true) {
    if (update) globalSettings.lightMode = !globalSettings.lightMode;
    for (const item of ["background", "text", "card", "input", "accent", "active-brightness", "hover-brightness"]) document.body.style.setProperty(`--${item}`, `var(--${item}-${globalSettings.lightMode ? "light" : "dark"})`);
    forceReRender(prev => prev + 1);
  }
  /**
   * Update some CSS values. This should be done after some settings have been changed.
   */
  function updateCss() {
    document.body.style.setProperty("--overflow-table", globalSettings.resizeOption === 0 ? "unset" : "auto");
    document.body.style.setProperty("--resize-table", globalSettings.resizeOption === 0 ? "unset" : globalSettings.resizeOption === 1 ? "horizontal" : globalSettings.resizeOption === 2 ? "vertical" : "both");
    document.body.style.setProperty("--suggested-flex", globalSettings.oneLineCard ? "1 0 99999px" : "1 0 600px");
  }
  useEffect(() => {
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop",  async (e) => {
      e.preventDefault();
      const newFiles = await HandleDroppedFiles(e);
      const outputArr: FileStorage[] = [];
      for (const file of newFiles) {
        const metadata = await getFileObject(file);
        metadata && outputArr.push(metadata);
      }
      outputArr.length !== 0 && updateFiles(prev => [...prev, ...outputArr]);
    });
    // @ts-ignore;
    if (typeof crypto === "undefined") window.crypto = {};
    // @ts-ignore;
    if (typeof crypto.randomUUID === "undefined") crypto.randomUUID = () => Math.random().toString();
    globalSettings.lightMode && changeTheme(false);
    updateCss();
  }, [])
  return <>
    <header>
      <div className="flex hcenter gap">
      <img style={{width: "48px", height: "48px"}} src={`./logo_${globalSettings.lightMode ? "light" : "dark"}.svg`}></img>
      <h1>Media Metadata Reader</h1>
      </div>
      <p>Read the metadata of audio and videos, and display them in a table. Don't worry, everything will be elaborated locally.</p>
    </header><br></br>
    <div className="flex hcenter gap">
      <button onClick={() => filePicker(false)}>Pick files</button>
      <button onClick={() => filePicker(true)}>Pick folder</button>
    </div><br></br>
    {files.length !== 0 && <><div className="card">
      <h2>Results:</h2>
      <select defaultValue={selectedFileIndex} onChange={(e) => {updateSelectedFileIndex(+e.target.value)}}>
        {files.map((item, i) => <option value={i}>{item.file._path}</option>)}
      </select><br></br><br></br>
      <div key={`SelectedItem-${selectedFileIndex}-${rerender}`} className="mainFlex flex gap">
        {files[selectedFileIndex] && files[selectedFileIndex].metadata.common && <div onClick={() => {console.log(":("); standardDownloader(files[selectedFileIndex].metadata.common, files[selectedFileIndex].file.name)}} className="card secondCard">
          <h3>Common values:</h3>
          <ObjectExplorer fileName={files[selectedFileIndex].file.name} obj={files[selectedFileIndex].metadata.common}></ObjectExplorer>
        </div>}
        {files[selectedFileIndex] && files[selectedFileIndex].metadata.format && <div className="card secondCard">
          <h3>Format information:</h3>
          <ObjectExplorer fileName={files[selectedFileIndex].file.name} obj={files[selectedFileIndex].metadata.format}></ObjectExplorer>
        </div>}
        {files[selectedFileIndex] && files[selectedFileIndex].metadata.native && <div className="card secondCard">
          <h3>Tag type information:</h3>
          <ObjectExplorer fileName={files[selectedFileIndex].file.name} obj={files[selectedFileIndex].metadata.native}></ObjectExplorer>
        </div>}
      </div>
    </div><br></br>
      <div className="card">
        <h2>Export:</h2>
        <label className="flex hcenter gap">
          <input type="checkbox" onChange={(e) => { globalSettings.exportAsCsv = e.target.checked }} defaultChecked={globalSettings.exportAsCsv}></input>Export as CSV (experimental; if disabled a JSON file will be downloaded)
        </label><br></br>
        <label className="flex hcenter gap">
          <input type="checkbox" onChange={(e) => { globalSettings.keepUint8Arrays = e.target.checked }} defaultChecked={globalSettings.keepUint8Arrays}></input>Save Uint8Arrays in the output file (will greatly increase the output file size)
        </label><br></br>
        <label className="flex hcenter gap">
          <input type="checkbox" onChange={(e) => { globalSettings.downloadAlbumArt = e.target.checked }} defaultChecked={globalSettings.downloadAlbumArt}></input>Download also the album art
        </label><br></br>
        <label className="flex hcenter gap">
          When downloading all the selected items, <select onChange={(e) => { globalSettings.multipleExportType = +e.target.value }} defaultValue={globalSettings.multipleExportType}>
            <option value={0}>Add all items in the output file</option>
            <option value={1}>Create an output file for each selected file, and download it</option>
            <option value={2}>Create an output file for each selected file, and download it as a zip file</option>
          </select>
        </label><br></br>
        <div className="flex hcenter gap">
      <button onClick={async () => {
        const downloader = new DownloadFile(globalSettings.multipleExportType === 2);
        await downloader.promise;
        const outputText = new Blob([globalSettings.exportAsCsv ? convertToCsv(convertToArray(structuredClone([files[selectedFileIndex]]))) : JSON.stringify(structuredClone(files[selectedFileIndex].metadata), (key, value) => {
          if (typeof value === "object") return checkObject(value);
          return value;
        })]);
        await downloader.add(outputText, `${files[selectedFileIndex].file.name}.${globalSettings.exportAsCsv ? "csv" : "json"}`);
        if (globalSettings.downloadAlbumArt && files[selectedFileIndex].metadata.common) {
          for (const file of getAlbumArtBlob(files[selectedFileIndex].metadata.common, files[selectedFileIndex].file)) await downloader.add(file, file._path);
        }
        await downloader.release();
      }}>Export the selected file</button>
      <button onClick={async () => {
        const downloader = new DownloadFile(globalSettings.multipleExportType === 2);
        await downloader.promise;
        for (const { file, metadata } of files) {
          const outputText = new Blob([globalSettings.exportAsCsv ? convertToCsv(convertToArray(globalSettings.multipleExportType === 0 ? structuredClone(files.map(i => i.metadata)) : structuredClone([metadata]))) : JSON.stringify(globalSettings.multipleExportType === 0 ? structuredClone(files.map(i => i.metadata)) : structuredClone(metadata), (key, value) => {
            if (typeof value === "object") return checkObject(value);
            return value;
          })]);
          await downloader.add(outputText, `${file.name}.${globalSettings.exportAsCsv ? "csv" : "json"}`);
          if (globalSettings.multipleExportType === 0) break;
          if (globalSettings.downloadAlbumArt && files[selectedFileIndex].metadata.common) {
            for (const file of getAlbumArtBlob(files[selectedFileIndex].metadata.common, files[selectedFileIndex].file)) await downloader.add(file, file._path);
          }
        }
        await downloader.release();
      }}>Export all the files</button>
        </div>
      </div><br></br>
      <div className="card">
        <h2>Other settings:</h2>
        <label className="flex hcenter gap">
          When a table cell is clicked, <select defaultValue={globalSettings.downloadWhenClicked} onChange={(e) => {globalSettings.downloadWhenClicked = +e.target.value}}>
            <option value={0}>do nothing</option>
            <option value={1}>download its CSV, JSON or plain text</option>
            <option value={2}>copy its CSV, JSON or plain text to the clipboard</option>
          </select>
        </label><br></br>
        <label className="flex hcenter gap">
          Permit to resize the table: <select defaultValue={globalSettings.resizeOption} onChange={(e) => {globalSettings.resizeOption = +e.target.value; updateCss()}}>
            <option value={0}>never</option>
            <option value={1}>horizontally</option>
            <option value={2}>vertically</option>
            <option value={3}>horizontally and vertically</option>
          </select>
        </label><br></br>
        <label className="flex hcenter gap">
          <input type="checkbox" defaultChecked={globalSettings.oneLineCard} onChange={(e) => {globalSettings.oneLineCard = e.target.checked; updateCss();}}></input>Put each metadata card in its own line
        </label><br></br>
      <button onClick={() => updateFiles([])}>Empty selected array</button>
      </div>
    </>}<br></br><br></br><br></br>
    <p>Version {window.version}</p>
    <div className="flex hcenter gap">
      <button style={{width: "fit-content"}} onClick={() => changeTheme()}>Change theme</button>
      <button style={{width: "fit-content"}} onClick={() => showOpenSourceDialog(true)}>Show open source dialog</button>
    </div>
    {openSourceDialog && <OpenSourceDialog callback={() => showOpenSourceDialog(false)}></OpenSourceDialog>}
  </>
}