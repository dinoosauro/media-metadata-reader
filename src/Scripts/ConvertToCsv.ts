/**
 * This is a script that I made for a private project a few weeks ago.
 *  It turns out that handling JavaScript objects can be harder than expected. I tried my best, but certainly it could be written better.
 */


/**
 * Settings of the application
 */
export let globalSettings = new Proxy({
    /**
     * If Uint8Arrays should be kept in the output CSV file
     */
    keepUint8Arrays: false,
    /**
     * Export everything in a CSV
     */
    exportAsCsv: false,
    /**
     * The number that indicates how the application should behave when exporting all the selected files.
     * - If 0, all the selected files will be added in a single output file
     * - If 1, each file will have its output file, and the files will be downloaded using normal links
     * - If 2, each file will have its output file, and the files will be added in a zip file
     */
    multipleExportType: 0,
    /**
     * If also the album art should be downloaded
     */
    downloadAlbumArt: false,
    /**
     * What the application should do when a table item is clicked
     * - If 0, the application shouldn't do anything
     * - If 1, the application should download the item as a JSON, CSV or plain text data
     * - If 2, the application should copy the JSON, CSV or plain text in the clipboard
     */
    downloadWhenClicked: 0,
    /**
     * If light mode is enabled (let's hope not)
     */
    lightMode: false,
    /**
     * Show the image in a dialog instead of downloading it
     */
    showImageDialog: true,
    /**
     * If the table columns should be resizable:
     * - If 0, they shouldn't be resizeable
     * - If 1, they should be resizable only horizontally
     * - If 2, they should be resizable only vertically
     * - If 3, they should be resizable both vertically and horizontally.
     */
    resizeOption: 0,
    /**
     * If each card should be displayed on one line. If false, multiple card will be displayed on the same line if there are more than 600 px for each card.
     */
    oneLineCard: false
}, {
    set: (obj, prop, value) => { // Save the settings
        // @ts-ignore
        obj[prop] = value;
        localStorage.setItem("MediaMetadataRead-Settings", JSON.stringify(globalSettings));
        return true;
    },
})

// Restore previous settings
const restorePrev = JSON.parse(localStorage.getItem("MediaMetadataRead-Settings") ?? "{}");
// @ts-ignore
for (const key in restorePrev) globalSettings[key] = restorePrev[key];

/**
 * Convert a parsed array to a CSV FIle
 * @returns the CSV string
 */
export function convertToCsv({ headers, entries }: { headers: string[], entries: string[][] }) {
    let str = `\"${headers.map(item => csvCell(item)).join("\",\"")}\"\n`;
    for (const entry of entries) {
        str += `\"${entry.map(item => csvCell(item)).join("\",\"")}\"\n`;
    }
    return str;
}
/**
 * Escape characters for the CSV cell
 * @param str the string to parse
 * @returns the parsed string
 */
function csvCell(str: any) {
    return String(typeof str === "undefined" ? "" : str).replace(/\"/g, "\"\"");
}

/**
 * 
 * @param obj the array of objects that should be added in the list
 * @param pre the position of the current object in the main object. 
 * 
 * Example: `a: "a", b: {d: "d", c: "c"}`
 * 
 * When handling the object `b`, the `pre` value must be `b.`, since we're reading the content inside that nested object.
 * @param disableArray if Arrays should be elaborated or not
 * @returns an object, with the headers of the table and the other rows.
 */
export function convertToArray(obj: any[], pre?: string, disableArray?: boolean) {
    /**
     * The headers of the output table
     */
    const headerArr: string[] = [];
    /**
     * An array of the rows of the table
     */
    const entryArr: string[][] = [];
    /**
     * 
     * @param object the object that should be analyzed
     * @param originalKey the key used from the main Object to access it.
     * 
     * Example: `a: "a", b: {d: "d", c: "c"}`
     * 
     * If the object `b` is being accessed, the originalKey must be `b`
     * @param disableArr if the script should treat arrays as normal objects.
     */
    function handleObjects(object: any, originalKey: string, disableArr: boolean) {
        const { headers, entries } = convertToArray([object], `${pre ? `${pre}` : ""}${originalKey}.`, disableArr); // Let's elaborate this new object
        for (const header of headers) { // Let's add a new header if it's a new entry
            if (headerArr.indexOf(header) === -1) headerArr.push(header);
        }
        for (let i = 0; i < entries[0].length; i++) { // And le'ts add the new entries. Since we're processing one item at the time, we are sure that the entries array contains only one item.
            entryArr[entryArr.length - 1][headerArr.indexOf(headers[i])] = entries[0][i];
        }
    }
    for (const object of obj) { // `object` becomes the object of the current row
        entryArr[entryArr.length] = [];
        for (let key in object) {
            /**
             * The key used to access the current object
             */
            let originalKey = `${key}`;
            /**
             * The _path_ that permits to access the current object
             */
            key = `${pre ?? ""}${key}`;
            if (typeof object[originalKey] === "function") {
                // Don't do anything
            } else if (!disableArray && Array.isArray(object[originalKey])) { // Read the content inside the array
                if (headerArr.indexOf(key) === -1 && object[originalKey].length < 2) headerArr.push(key); // If the length of the array is composed of 2 or more items, its key will be added later
                switch (object[originalKey].length) {
                    case 0: // Add a blank string
                        entryArr[entryArr.length - 1][headerArr.indexOf(key)] = "";
                        break;
                    case 1: { // Add the single file as the content of that ID
                        if (typeof object[originalKey][0] === "object") {
                            handleObjects(object[originalKey][0], originalKey, true)
                        } else {
                            entryArr[entryArr.length - 1][headerArr.indexOf(key)] = object[originalKey].toString()
                        };
                        break;
                    }
                    default: { // We'll have to handle an actual array
                        object[originalKey] = checkObject(object[originalKey]); // We'll delete all references to Uint8Arrays if the user wants so
                        let [isObject, notObject] = [[] as any[], [] as string[]];
                        for (const item of object[originalKey]) { // Let's categorize all the items inside the array (so, if they're objects or not)
                            if (!globalSettings.keepUint8Arrays && checkObj(item)) continue; // This should be unnecessary
                            (typeof item === "object" ? isObject : notObject).push(item);
                        }
                        /**
                         * Let's transform the isObject array, so that we have an object with as a key the header name, and as a value the array of possible options
                         * Example: `[{a: "a", b: "b"}, {a: "c", b: "d"}]` becomes `{a: ["a", "c"], b: ["b", "d"]}`
                         */
                        isObject = isObject.reduce((entry, obj) => { 
                            Object.keys(obj).forEach(key => {
                                entry[key] = [...(entry[key] ?? []), obj[key]];
                            });
                            return entry;
                        }, {});
                        for (const object in isObject) { // Now let's add them to the object storage
                            const newKey = `${key}.${object}`
                            if (headerArr.indexOf(newKey) === -1) headerArr.push(newKey);
                            entryArr[entryArr.length - 1][headerArr.indexOf(newKey)] = JSON.stringify(isObject[object]);
                        }
                        if (notObject.length !== 0) { // Let's add also non-objects to the entry storage
                            if (headerArr.indexOf(key) === -1) headerArr.push(key);
                            entryArr[entryArr.length - 1][headerArr.indexOf(key)] = JSON.stringify(notObject);
                        }
                        break;
                    }
                }
            } else if (typeof object[originalKey] === "object") { // Check if the object is an Uint8Array and, in that case, add it only if the user wants so. Otherwise, let's read the content of that object
                if (!checkObj(object[originalKey])) handleObjects(object[originalKey], originalKey, false); else if (globalSettings.keepUint8Arrays) {
                if (headerArr.indexOf(key) === -1) headerArr.push(key); // Let's add the new key if it hasn't been added
                    entryArr[entryArr.length - 1][headerArr.indexOf(key)] = JSON.stringify(object[originalKey])
                }
            } else { // Content that can be easily converted using a string
                if (headerArr.indexOf(key) === -1) headerArr.push(key);
                entryArr[entryArr.length - 1][headerArr.indexOf(key)] = object[originalKey]?.toString();
            }
        }
    }
    return {
        headers: headerArr,
        entries: entryArr
    };
}
function checkObj(obj: any) {
    return obj instanceof Int8Array || obj instanceof Uint8Array || obj instanceof Uint8ClampedArray || obj instanceof Int16Array || obj instanceof Uint16Array || obj instanceof Int32Array || obj instanceof Uint32Array || obj instanceof Float32Array || obj instanceof Float64Array || obj instanceof BigInt64Array || obj instanceof BigUint64Array || obj instanceof ArrayBuffer || obj instanceof Blob || obj instanceof File
}

export function checkObject(obj: any) {
    if (globalSettings.keepUint8Arrays) return obj;
    for (const key in obj) {
        if (typeof obj[key] === "object") {
            obj[key] = checkObj(obj[key]) ? "Binary data" : checkObject(obj[key]);
        }
    }
    return obj;
}