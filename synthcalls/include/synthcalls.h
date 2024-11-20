#pragma once
#include <stdarg.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C"
{
#endif
    typedef struct
    {
        // unified, fixed-size buffer
        char *unified_buffer;
        size_t unified_buffer_size;

        // info to interpret the unified buffer
        // as multiple sub-buffers
        unsigned int *buffer_base_idx;
        size_t *buffer_sizes;
        unsigned int buffer_count;

        // sub-buffer semantics
        int *buffer_idx;
        bool *is_closed;
    } async_synthcalls_t;

    void init_interface(async_synthcalls_t *interface, size_t *buffer_sizes, unsigned int num_buffers);

    void async_call(async_synthcalls_t *interface, unsigned int callspot, bool isLast, const char *types, ...);

    void close_callspot(async_synthcalls_t *interface, unsigned int callspot);
#ifdef __cplusplus
}
#endif
