#!/usr/bin/env python

import subprocess
from string import Template

str_to_print = "Hello world from Assembly!\n"

# Generate payload
template = """
.intel_syntax noprefix
.text

.macro putchar chr
    lea rax, [rip+3f]
    mov qword ptr [rip+reentry_function], rax
    movabs rax, 0xFFFF000000000000+\chr
    ret
3:
.endmacro

.globl start
start:
    cmp qword ptr [rip+reentry_function], 0
    je 3f
    mov rax, qword ptr [rip+reentry_function]
    jmp rax
3:
    $payload
    // Return value
    movabs rax, 0xFFFF000000000000
    ret

.data

.globl reentry_function
reentry_function:
    .quad 0
"""

payload = ""
for c in str_to_print:
    payload += "putchar %d\n"%(ord(c))
payload = Template(template).substitute(payload=payload)

# Write payload
f = open("stage2_macOS.S", "w+")
f.write(payload)
f.close()

# Build payload
subprocess.check_call(['clang', '-nostdlib', '-static', 'stage2_macOS.S', '-o', 'stage2_macOS.o'])
subprocess.check_call(['gobjcopy', '-O', 'binary', 'stage2_macOS.o', 'stage2_macOS.bin'])

# Delete the generated source and binary
subprocess.check_call(['rm', 'stage2_macOS.S'])
subprocess.check_call(['rm', 'stage2_macOS.o'])
