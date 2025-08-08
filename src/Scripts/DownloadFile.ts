import type { BlobReader, ZipWriter } from "@zip.js/zip.js"

/**
 * Download one or multiple files, both by using browser's API and by using 
 */
export default class DownloadFile {
    /**
     * The ZipWriter object, loaded only if the user wants a zip file
     */
    #zip!: ZipWriter<Blob>
    /**
     * The BlobReader constructor, used when adding an item to a zip file
     */
    #blobReader!: typeof BlobReader
    /**
     * The promise created while the constructor loads the zip.js library
     */
    promise: Promise<void>
    /**
     * @param createZip if the items should be downloaded in a zip file. In that case, call `this.release()` after all the files have been added
     */
    constructor(createZip?: boolean) {
        this.promise = new Promise<void>(async (res) => {
            if (!createZip) res(); else {
                const zipjs = await import ("@zip.js/zip.js");
                this.#zip = new zipjs.ZipWriter(new zipjs.BlobWriter());
                this.#blobReader = zipjs.BlobReader;
                res();
            }
        });
    }
    /**
     * Add to the zip, or download a single file
     * @param blob the Blob to add
     * @param name the filename of the file
     */
    add = async (blob: Blob, name: string) => {
        this.#zip ? await this.#zip.add(name, new this.#blobReader(blob)) : this.#download(blob, name);
        !this.#zip && await new Promise(res => setTimeout(res, 200));
    }
    /**
     * Download the zip file. If no zip file is available, this function will do nothing.
     */
    release = async () => {
        this.#zip && this.#download(await this.#zip.close(), `MediaMetadataRead-`)
    }
    #download =(blob: Blob, name: string) => {
        const a = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(blob),
            target: "_blank",
            download: name
        });
        a.click();
    }
}