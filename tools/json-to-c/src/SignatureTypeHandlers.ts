import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";
import Clava from "@specs-feup/clava/api/clava/Clava.js";
import { Decl, FileJp, FunctionJp, Param } from "@specs-feup/clava/api/Joinpoints.js";

abstract class AHandler {
    protected header: FileJp;
    protected source: FileJp;
    protected name: string;

    constructor(name: string) {
        this.header = ClavaJoinPoints.file(name + ".h", ".");
        this.source = ClavaJoinPoints.file(name + ".c", ".");
        this.name = name;

        Clava.addFile(this.header);
        Clava.addFile(this.source);

        this.source.addInclude(name + ".h", false);
        const defaultIncludes = [
            "features-time64.h",
            "nl_types.h",
            "regex.h",
            "setjmp.h",
            "signal.h",
            "stdarg.h",
            "stdbool.h",
            "stddef.h",
            "stdio.h",
            "stdlib.h",
            "sys/types.h",
            "time.h",
            "wchar.h",
            "wctype.h"
        ]
        for (const include of defaultIncludes) {
            this.header.addInclude(include, true);
        }
    }

    public handle(signature: Record<string, any>): void {
        const mappings = signature["mappings"];
        for (const mapping of mappings) {
            const name = mapping["name"];
            const returnType = mapping["returnType"];
            const parameters = mapping["parameters"];

            const newSig = this.buildSignature(name, returnType, parameters);
            this.header.insertEnd(newSig);

            const newImpl = this.buildFunctionImpl(signature, newSig);
            this.source.insertEnd(newImpl);
        }
    }

    protected buildSignature(name: string, returnType: string, parameters: Record<string, string>[]): FunctionJp {
        const newParams: Decl[] = [];
        for (const param of parameters) {
            newParams.push(ClavaJoinPoints.param(param["name"], ClavaJoinPoints.type(param["type"])));
        }
        const newFun = ClavaJoinPoints.functionDecl(name, ClavaJoinPoints.type(returnType), ...newParams);
        return newFun;
    }

    protected buildFunctionImpl(signature: Record<string, any>, newSig: FunctionJp): FunctionJp {
        const newFun = newSig.copy() as FunctionJp;

        const args = newFun.params.map(param => param.varref());
        const call = ClavaJoinPoints.callFromName(signature["name"], newFun.returnType, ...args);
        const retExpr = ClavaJoinPoints.returnStmt(call);
        const scope = ClavaJoinPoints.scope(retExpr);

        newFun.setBody(scope);
        return newFun;
    }
}

export class SynthesizableHandler extends AHandler {
    constructor() {
        super("hls-libc-synthesizable");
    }
}