import { Decl, FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import { AHandler } from "./AHandler.js";
import ClavaJoinPoints from "@specs-feup/clava/api/clava/ClavaJoinPoints.js";

export class AsyncHostAllocHandler extends AHandler {
    constructor(libraryPrefix: string) {
        super("async_host_alloc", libraryPrefix);
    }

    protected applyHeaderPrologue(): void {
        this.header.addInclude(`${this.libName}_types.h`, false);
        return;
    }

    protected buildSignature(name: string, returnType: string, parameters: Record<string, string>[]): FunctionJp {
        const newName = `${name}_alloc`;
        const retType = ClavaJoinPoints.type("hls_async_call*");

        const newParams: Decl[] = [
            ClavaJoinPoints.param("n_calls", ClavaJoinPoints.type("unsigned int"))
        ];
        const newFun = ClavaJoinPoints.functionDecl(newName, retType, ...newParams);
        return newFun;
    }


    protected buildFunctionImpl(signature: Record<string, any>, newSig: FunctionJp): FunctionJp {
        const newFun = newSig.copy() as FunctionJp;

        const sizes = [];
        for (const param of signature.parameters) {
            sizes.push(`sizeof(${param.type})`);
        }
        if (sizes.length === 0) {
            sizes.push("1");
        }
        const code = [
            `size_t buf_size = (${sizes.join(" + ")}) * n_calls;`,
            `int8_t* buf = (int8_t*)malloc(buf_size);`,
            ``,
            `hls_async_call* call = (hls_async_call*)malloc(sizeof(hls_async_call));`,
            `call->kernel_info->size = buf_size;`,
            `call->kernel_info->idx = -1;`,
            `call->kernel_info->is_closed = false;`,
            `call->buffer = buf;`,
            `call->host_idx = -1;`,
            ``,
            `return call;`
        ];
        const stmts = code.map((c) => ClavaJoinPoints.stmtLiteral(c));
        const body = ClavaJoinPoints.scope(...stmts);
        newFun.setBody(body);

        return newFun;
    }
}