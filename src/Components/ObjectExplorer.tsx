import { useRef, type ReactNode } from "react";
import standardDownloader from "../Scripts/StandardDownloader";
import { globalSettings } from "../Scripts/ConvertToCsv";
import { createRoot } from "react-dom/client";

interface Props {
    /**
     * The object that should be displayed in the table
     */
    obj: any,
    /**
     * If the passed object already follows the [string, any][] type (so, the one obtained by doing Object.entries). 
     * This is usually enabled when handling arrays, since we can use their index as a key
     */
    alreadyEntries?: boolean,
    /**
     * If true, the headers of the table won't be shown
     */
    miniView?: boolean,
    /**
     * The previous table R/G/B value, so that it'll be increased (or decreased) of 20 RGB value
     */
    startTableRGB?: number,
    /**
     * The name of the file from which the metadata was extracted
     */
    fileName: string,
    /**
     * If 20 should be subtracted from the R/G/B value instead of added.
     * This is done when we've reached more than 255 or less than 0, and so we need to go back to the previous color.
     */
    invertRgb?: boolean
}
/**
 * Display all of an Object's properties in a table
 * @returns 
 */
export default function ObjectExplorer({ obj, alreadyEntries, miniView, startTableRGB = globalSettings.lightMode ? 226 : 29, fileName, invertRgb }: Props) {
    const shouldRgbBeInverted = useRef(invertRgb || false);
    const tableRgbColor = useRef(startTableRGB + (globalSettings.lightMode ? invertRgb ? +20 : -20 : invertRgb ? -20 : 20))
    if ((tableRgbColor.current + 20) > 255 || (tableRgbColor.current - 20) < 0) shouldRgbBeInverted.current = !shouldRgbBeInverted.current;
    const entries: [string, unknown][] = alreadyEntries ? obj : Object.entries(obj);

    /**
     * Obtain a new Cell for the Table
     * @returns 
     */
    function Cell({ children, isCodeAdded, click }: {
        children: ReactNode,
        /**
         * If the element of the table is a <code>, so that additional style (extra padding and normal color) will be added
         */
        isCodeAdded?: boolean,
        /**
         * The function that'll be called when clicked
         * @param e the click event
         */
        click?: (e: React.MouseEvent<HTMLTableCellElement, MouseEvent>) => void
    }) {
        return <td onClick={(e) => click ? click(e) : e.stopPropagation()} style={{ backgroundColor: `rgb(${tableRgbColor.current}, ${tableRgbColor.current}, ${tableRgbColor.current})`, border: isCodeAdded ? `10px solid #ffffff00` : undefined, borderLeft: isCodeAdded ? "0px" : undefined, borderRight: isCodeAdded ? "0px" : "", color: isCodeAdded ? undefined : tableRgbColor.current > 140 ? "var(--text-light)" : "var(--text-dark)" }}>
            {children}
        </td>
    }
    /**
     * Get the item to display in the cell
     * @param obj the object to read. Can be of any type
     * @param possibleSourceFormat the suggested source format of binary files, if found
     * @returns a ReactNode with the already-filled cell
     */
    function getValue(obj: any, possibleSourceFormat?: any) {
        /**
         * The function that'll be called for binary data viewing or downloading
         * @param e the Click event on the anchor element
         */
        function binaryDownloader(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
            if (globalSettings.showImageDialog && Array.isArray(possibleSourceFormat) && typeof possibleSourceFormat[1] === "string" && possibleSourceFormat[1].startsWith("image") && (e.target as HTMLElement).getAttribute("data-forcedownload") !== "true") { // We'll need to show the image in a new dialog
                e.preventDefault();
                const div = document.createElement("div");
                const root = createRoot(div);
                root.render(<div className="dialog flex hcenter wcenter">
                    <div>
                        <h2>Image viewer:</h2>
                        <p>{fileName}</p><br></br>
                        <div className="flex wcenter">
                        <img style={{ maxWidth: "45vw", maxHeight: "45vh", borderRadius: "8px" }} src={URL.createObjectURL(new Blob([obj as BlobPart]))}></img><br></br>
                        </div><br></br>
                        <div className="flex hcenter gap">
                            <button onClick={() => {
                                (e.target as HTMLElement).setAttribute("data-forcedownload", "true"); // Avoid creating a second dialog with the image
                                (e.target as HTMLElement).click();
                            }}>
                                Download image
                            </button>
                            <button onClick={() => {
                                (div.firstChild as HTMLElement).style.opacity = "0";
                                setTimeout(() => {
                                    URL.revokeObjectURL((div.querySelector("img") as HTMLImageElement).src);
                                    root.unmount();
                                    div.remove();
                                }, 210);
                            }}>Close</button>
                        </div>
                    </div>
                </div>);
                document.body.append(div);
                setTimeout(() => {(div.firstChild as HTMLElement).style.opacity = "1"}, 15);
            } else if (!(e.target as HTMLAnchorElement).href?.startsWith("blob")) { // We need to create a new Blob URL for this resource
                e.preventDefault();
                (e.target as HTMLAnchorElement).href = URL.createObjectURL(new Blob([obj as ArrayBuffer]));
                (e.target as HTMLAnchorElement).click();
            } else (e.target as HTMLElement).removeAttribute("data-forcedownload"); // The item has been downloaded, so we can remove the forcedownload attribute
        }
        switch (typeof obj) {
            case "boolean":
                return <Cell click={(e) => { e.stopPropagation(); standardDownloader(obj ? "true" : "false", fileName) }}>{obj ? "true" : "false"}</Cell>
            case "function":
                return <Cell>(Function)</Cell>
            case "object":
                if (obj === null) return <Cell isCodeAdded={true}><code>null</code></Cell>
                if (obj instanceof Date) return <Cell click={(e) => { e.stopPropagation(); globalSettings.downloadWhenClicked === 2 && standardDownloader(obj.toLocaleString(), fileName) }} isCodeAdded={true}><code style={{ marginRight: "10px" }}>Date:</code> {obj.toLocaleString()}</Cell>
                if (obj instanceof RegExp) return <Cell isCodeAdded={true}><code style={{ marginRight: "10px" }}>RegEx:</code> {String(obj)}</Cell>
                if (obj instanceof Map) return ObjectExplorer({ obj: Array.from(obj), alreadyEntries: true, miniView: true, startTableRGB: tableRgbColor.current, fileName, invertRgb: shouldRgbBeInverted.current });
                if (obj instanceof Int8Array || obj instanceof Uint8Array || obj instanceof Uint8ClampedArray || obj instanceof Int16Array || obj instanceof Uint16Array || obj instanceof Int32Array || obj instanceof Uint32Array || obj instanceof Float32Array || obj instanceof Float64Array || obj instanceof BigInt64Array || obj instanceof BigUint64Array || obj instanceof ArrayBuffer) return <Cell><a href="_blank" download={`${fileName.substring(0, fileName.lastIndexOf("."))}${Array.isArray(possibleSourceFormat) && typeof possibleSourceFormat[1] === "string" ? `.${possibleSourceFormat[1].substring(possibleSourceFormat[1].indexOf("/") + 1)}` : ""}`} onClick={binaryDownloader}>Binary data</a></Cell>
                if (obj instanceof Blob || obj instanceof File) return <Cell><a target="_blank" onClick={binaryDownloader} download={`${obj instanceof File ? obj.name.substring(0, obj.name.lastIndexOf(".")) : fileName.substring(0, fileName.lastIndexOf("."))}.${obj.type.substring(obj.type.indexOf("/") + 1) === "mpeg" ? "mp3" : obj.type.substring(obj.type.indexOf("/") + 1)}`}>{obj instanceof File ? obj.webkitRelativePath || obj.name : "Binary data"}</a></Cell>
                return <Cell>{ObjectExplorer({ obj, miniView: true, startTableRGB: tableRgbColor.current, fileName, invertRgb: shouldRgbBeInverted.current })}</Cell>
        }
        return <Cell click={(e) => { e.stopPropagation(); standardDownloader(String(obj), fileName) }}>{String(obj)}</Cell>
    }
    return <>
        <table>
            {!miniView && <thead>
                <tr>
                    <th>Key:</th>
                    <th>Value:</th>
                </tr>
            </thead>}
            <tbody>
                {entries.map(([key, value]) => <tr>
                    <Cell click={(e) => {
                        e.stopPropagation();
                        standardDownloader(structuredClone({ [key]: value }), fileName);
                    }} isCodeAdded={Array.isArray(obj) || !miniView}>{Array.isArray(obj) || !miniView ? <code>{key}</code> : key}</Cell>
                    {getValue(value, entries.find(item => item[0] === "format"))}
                </tr>)}
            </tbody>
        </table>
    </>
}