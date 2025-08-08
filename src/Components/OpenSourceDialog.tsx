import { useEffect, useRef, useState } from "react"


interface Props {
    /**
     * The function to call to close the dialog
     */
    callback: () => void
}
/**
 * Show the open source licenses dialog
 * @returns the OpenSourceDiaog ReactNode
 */
export default function OpenSourceDialog({callback}: Props) {
    /**
     * A list of all the open source licenses used
     */
    const availableSources = [
        { license: "MIT", name: "React", author: "Meta Platforms, Inc. and affiliates.", link: "https://github.com/facebook/react", description: "Framework used to build this website" },
        { license: "BSD-3", name: "zip.js", author: "2023, Gildas Lormeau", link: "https://github.com/gildas-lormeau/zip.js", description: "Library used to get the zip file content" },
        { license: "MIT", name: "music-metadata", author: "2025 Borewit", link: "https://github.com/Borewit/music-metadata", description: "Library used to get the music metadata" },
        { license: "MIT", name: "Vite", author: "2019-present, VoidZero Inc. and Vite contributors", link: "https://github.com/vitejs/vite", description: "Website bundler" }
    ]
    const [selectedSource, updateSelectedSource] = useState(0);
    /**
     * Ref of main div, so that the opacity transition can be applied
     */
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setTimeout(() => {if (ref.current) ref.current.style.opacity = "1";}, 15);
    }, []);
    return <div ref={ref} className="dialog flex hcenter wcenter">
        <div>
            <h2>Open source licenses</h2>
            <select defaultValue={selectedSource} onChange={(e) => updateSelectedSource(+e.target.value)}>
                {availableSources.map((a, i) => <option value={i}>{a.name}</option>)}
            </select><br></br><br></br>
            <div className="card secondCard">
                <h3><a href={availableSources[selectedSource].link} target="_blank">{availableSources[selectedSource].name}</a></h3>
                <i>{availableSources[selectedSource].description}</i><br></br><br></br>
                {availableSources[selectedSource].license === "BSD-3" ? <div>
                    BSD 3-Clause License<br></br><br></br>

                    Copyright (c) {availableSources[selectedSource].author}<br></br><br></br>

                    Redistribution and use in source and binary forms, with or without
                    modification, are permitted provided that the following conditions are met:

                    <ol>
                        <li>
                            Redistributions of source code must retain the above copyright notice, this
                            list of conditions and the following disclaimer.
                        </li>
                        <li>
                            Redistributions in binary form must reproduce the above copyright notice,
                            this list of conditions and the following disclaimer in the documentation
                            and/or other materials provided with the distribution.
                        </li>
                        <li>
                            Neither the name of the copyright holder nor the names of its
                            contributors may be used to endorse or promote products derived from
                            this software without specific prior written permission.
                        </li>
                    </ol><br></br>
                    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
                    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
                    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
                    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
                    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
                    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
                    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
                    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

                </div> : <div>
                    The MIT License (MIT)<br></br><br></br>

                    Copyright (c) {availableSources[selectedSource].author}<br></br><br></br>

                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br></br><br></br>

                    <ul>
                        <li>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</li>
                    </ul><br></br>

                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

                </div>}
            </div><br></br>
                <button onClick={async () => {
                    if (ref.current) {
                        ref.current.style.opacity = "0";
                        await new Promise(res => setTimeout(res, 210));
                    }
                    callback();
                }}>Close</button>
        </div>
    </div>
}