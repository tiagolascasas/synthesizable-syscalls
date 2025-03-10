import Clava from "@specs-feup/clava/api/clava/Clava.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Io from "@specs-feup/lara/api/lara/Io.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import { SynthesizableHandler } from "./SynthesizableHandler.js";
import { ReimplementableHandler } from "./ReimplementableHandler.js";
import { AsyncKernelHandler } from "./AsyncKernelHandler.js";
import { FileJp } from "@specs-feup/clava/api/Joinpoints.js";
import { AsyncHostAllocHandler } from "./AsyncHostAllocHandler.js";
import { AsyncHostListenerHandler } from "./AsyncHostListenerHandler.js";
import { PassthroughHandler } from "./PassthroughHandler.js";

export class JsonToCConverter {
    constructor() {
        Clava.pushAst(ClavaJoinPoints.program());
    }

    public convert(json: Record<string, any>, libName: string, additionalHeaders: string[] = [], additionalSources: string[] = [], outputFolders: string[] = ["./output"]): boolean {
        for (const source of additionalSources) {
            const file = ClavaJoinPoints.file(source);
            Clava.addFile(file);
            Clava.rebuild();
        }

        const passthroughHandler = new PassthroughHandler(libName, "passthrough");
        const hostHandler = new PassthroughHandler(libName, "host");
        const synthHandler = new SynthesizableHandler(libName);
        const reimpHandler = new ReimplementableHandler(libName);
        const asyncKernelHandler = new AsyncKernelHandler(libName);
        const asyncHostAllocHandler = new AsyncHostAllocHandler(libName);
        const asyncHostListenerHandler = new AsyncHostListenerHandler(libName);

        for (const [key, value] of Object.entries(json)) {
            const type = value["type"];
            if (type == "passthrough") {
                passthroughHandler.handle(value);
            }
            if (type == "host") {
                hostHandler.handle(value);
            }
            if (type == "synthesizable") {
                synthHandler.handle(value);
            }
            if (type == "reimplementable") {
                reimpHandler.handle(value);
            }
            if (type == "async") {
                asyncKernelHandler.handle(value);
                asyncHostAllocHandler.handle(value);
                asyncHostListenerHandler.handle(value);
            }
        }
        asyncKernelHandler.applyHeaderEpilogue();

        const headerNames: string[] = [];
        for (const header of additionalHeaders) {
            const oldHeader = ClavaJoinPoints.file(header);
            Clava.addFile(oldHeader);

            const headerName = `${libName}_${oldHeader.name}`;
            headerNames.push(headerName);

            const newHeader = ClavaJoinPoints.file(headerName, ".");
            this.copyHeader(oldHeader, newHeader);

            oldHeader.detach();
            Clava.addFile(newHeader);

        }
        headerNames.push(passthroughHandler.getHeaderName());
        headerNames.push(hostHandler.getHeaderName());
        headerNames.push(synthHandler.getHeaderName());
        headerNames.push(reimpHandler.getHeaderName());
        headerNames.push(asyncKernelHandler.getHeaderName());
        headerNames.push(asyncHostAllocHandler.getHeaderName());
        headerNames.push(asyncHostListenerHandler.getHeaderName());
        this.createMasterHeader(headerNames, libName);

        this.deleteAdditionalFiles(additionalSources);

        for (const outputFolder of outputFolders) {
            Io.deleteFolderContents(outputFolder);
            Clava.writeCode(outputFolder);
        }
        return true;
    }

    private copyHeader(oldHeader: FileJp, newHeader: FileJp): void {
        const blob = ClavaJoinPoints.stmtLiteral(oldHeader.code);
        newHeader.insertEnd(blob);
    }

    private deleteAdditionalFiles(additionalSources: string[]): void {
        const toDelete = [];
        for (const file of Query.search(FileJp)) {
            for (const source of additionalSources) {
                if (source.includes(file.name)) {
                    toDelete.push(file);
                }
            }
        }
        for (const file of toDelete) {
            file.detach();
        }
    }

    private createMasterHeader(headerNames: string[], libName: string): void {
        const masterHeader = ClavaJoinPoints.file(libName + ".h", ".");
        for (const headerName of headerNames) {
            masterHeader.addInclude(headerName, false);
        }
        Clava.addFile(masterHeader);
    }
}
