#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include <pthread.h>
#include "synthcalls.h"

#define BIG_N 1000000000

void *kernel_A(async_call_buf *putchar_0, async_call_buf *putchar_1, async_call_buf *putchar_2, async_call_buf *assert_0)
{
    async_call(putchar_0, true, "c", 'H');
    unsigned long long *sum = (unsigned long long *)malloc(sizeof(unsigned long long));
    *sum = 0;

    async_call(assert_0, true, "i", *sum == 0);
    for (int i = 0; i < BIG_N; i++)
    {
        *sum += i;
    }
    async_call(putchar_1, true, "c", 'i');
    for (int i = 0; i < BIG_N; i++)
    {
        *sum *= i;
    }
    async_call(putchar_2, true, "c", '!');
    return (void *)(sum);
}

void wrapped_kernel_A()
{
    async_call_buf *putchar_0 = create_async_buf("c", 1);
    async_call_buf *putchar_1 = create_async_buf("c", 1);
    async_call_buf *putchar_2 = create_async_buf("c", 1);
    async_call_buf *assert_0 = create_async_buf("i", 1);

    kernel_A(putchar_0, putchar_1, putchar_2, assert_0);

    bool active = true;
    while (active)
    {
        active = false;
        active = active || listen_async_putchar(putchar_0);
        active = active || listen_async_putchar(putchar_1);
        active = active || listen_async_putchar(putchar_2);
        active = active || listen_async_assert(assert_0);
    }
}

void *kernel_B(async_call_buf *printf_0)
{
    unsigned long long *sum = (unsigned long long *)malloc(sizeof(unsigned long long));
    *sum = 0;

    for (int i = 0; i < 10; i++)
    {
        async_call(printf_0, false, "i", i);

        for (int i = 0; i < BIG_N / 100; i++)
        {
            *sum += i;
        }
    }
    close_async_buf((async_call_buf *)printf_0);
    return (void *)sum;
}

void wrapped_kernel_B()
{
    async_call_buf *printf_0 = create_async_buf("i", 10);

    kernel_B(printf_0);

    bool active = true;
    while (active)
    {
        active = false;
        active = active || listen_async_printf(printf_0, "index = %d\n");
    }
}

int main()
{
    printf("Test: three static putchar() callspots\n");
    wrapped_kernel_A();

    printf("\nTest: one printf() callspot, called 10 times (static number of repetitions)\n");
    wrapped_kernel_B();

    return 0;
}