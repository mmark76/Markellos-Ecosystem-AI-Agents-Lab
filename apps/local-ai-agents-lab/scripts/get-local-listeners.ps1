# Read Windows' TCP ownership table directly, without the slow NetTCPIP CIM provider.
# Fail closed if the table cannot be read: callers must never guess a process owner.
if (-not ('Markellos.LocalTcpTable' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net;
using System.Runtime.InteropServices;

namespace Markellos {
    public sealed class LocalListener {
        public string LocalAddress { get; set; }
        public int LocalPort { get; set; }
        public int OwningProcess { get; set; }
    }

    public static class LocalTcpTable {
        [DllImport("iphlpapi.dll", SetLastError = true)]
        private static extern uint GetExtendedTcpTable(IntPtr table, ref int size, bool sorted, int family, int tableClass, int reserved);

        [StructLayout(LayoutKind.Sequential)]
        private struct Tcp4 {
            public uint State, Address, Port, RemoteAddress, RemotePort, Pid;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct Tcp6 {
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)] public byte[] Address;
            public uint Scope, Port;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)] public byte[] RemoteAddress;
            public uint RemoteScope, RemotePort, State, Pid;
        }

        private static int Port(uint port) {
            return (ushort)IPAddress.NetworkToHostOrder(unchecked((short)(port & 0xffff)));
        }

        private static void Read(int family, List<LocalListener> result) {
            int size = 0;
            uint status = GetExtendedTcpTable(IntPtr.Zero, ref size, false, family, 3, 0);
            if (status != 122) throw new Win32Exception((int)status);
            for (int attempt = 0; attempt < 5; attempt++) {
                IntPtr buffer = Marshal.AllocHGlobal(size);
                try {
                    status = GetExtendedTcpTable(buffer, ref size, false, family, 3, 0);
                    if (status == 122) continue;
                    if (status != 0) throw new Win32Exception((int)status);
                    int count = Marshal.ReadInt32(buffer);
                    int rowSize = Marshal.SizeOf(family == 2 ? typeof(Tcp4) : typeof(Tcp6));
                    if (count < 0 || count > (size - 4) / rowSize) throw new InvalidOperationException("Invalid TCP listener table");
                    for (int i = 0; i < count; i++) {
                        IntPtr ptr = IntPtr.Add(buffer, 4 + i * rowSize);
                        if (family == 2) {
                            Tcp4 row = (Tcp4)Marshal.PtrToStructure(ptr, typeof(Tcp4));
                            result.Add(new LocalListener { LocalAddress = new IPAddress((long)row.Address).ToString(), LocalPort = Port(row.Port), OwningProcess = checked((int)row.Pid) });
                        } else {
                            Tcp6 row = (Tcp6)Marshal.PtrToStructure(ptr, typeof(Tcp6));
                            result.Add(new LocalListener { LocalAddress = new IPAddress(row.Address, row.Scope).ToString(), LocalPort = Port(row.Port), OwningProcess = checked((int)row.Pid) });
                        }
                    }
                    return;
                } finally { Marshal.FreeHGlobal(buffer); }
            }
            throw new InvalidOperationException("TCP listener table changed repeatedly");
        }

        public static LocalListener[] Get() {
            var result = new List<LocalListener>();
            Read(2, result);   // AF_INET
            Read(23, result);  // AF_INET6
            return result.ToArray();
        }
    }
}
'@
}

function Get-LocalListeners {
    param([int]$Port = 0)
    $listeners = @([Markellos.LocalTcpTable]::Get())
    if ($Port -ne 0) { return @($listeners | Where-Object { $_.LocalPort -eq $Port }) }
    return $listeners
}
