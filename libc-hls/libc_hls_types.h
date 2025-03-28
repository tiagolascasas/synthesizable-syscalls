#ifndef _LIBC_HLS_TYPES_H_
#define _LIBC_HLS_TYPES_H_

#ifndef __HLS_TYPES_H__
#define __HLS_TYPES_H__
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct
{
    size_t  size;
    int32_t idx;
    bool    is_closed;
} hls_async_info;

typedef struct
{
    hls_async_info* kernel_info;
    int8_t*         buffer;
    int32_t         host_idx;
} hls_async_call;

#endif // __HLS_TYPES_H__
#endif
