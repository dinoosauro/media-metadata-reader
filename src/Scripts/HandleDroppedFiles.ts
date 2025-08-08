/**
 * Get the files that have been dropped by the user
 * @param e the DragEvent
 * @returns the list of dropped files
 */
export default async function HandleDroppedFiles(e: DragEvent) {
    const output: File[] = [];
    for (const file of Array.from(e.dataTransfer?.items ?? []).map(item => item.webkitGetAsEntry()).filter(item => !!item)) await handleInnerDroppedFiles(file);
    /**
     * Read the FileSystemEntry and get all the inner files
     * @param file the FileSystemEntry that should be read. Can be either a file or a directory
     * @param source the string that indicates the current path of the file, obviously without the current filename. It should not end with /
     */
    async function handleInnerDroppedFiles(file: FileSystemEntry, source = "") {
        file.isFile ? await new Promise<void>(res => {
                (file as FileSystemFileEntry).file((result) => {
                    result._path = `${source}${source === "" ? "" : "/"}${file.name}`;
                    output.push(result);
                    res();
                }, (err) => {
                    console.warn(err);
                    res();
                })
        }) : await new Promise<void>((res) => {
            (file as FileSystemDirectoryEntry).createReader().readEntries(async (entries) => {
                for (const entry of entries) await handleInnerDroppedFiles(entry, `${source}${source === "" ? "" : "/"}${file.name}`);
                res();
            }, (err) => {
                console.warn(err);
                res();
            })
        })
    }
    return output;
}