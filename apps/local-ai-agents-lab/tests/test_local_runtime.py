import json
import errno
import socket
import tempfile
import unittest
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from unittest.mock import patch

import local_runtime


class RuntimeTests(unittest.TestCase):
    def test_default_port_is_attempted_before_os_selection(self):
        with patch.object(local_runtime, 'LocalServer', side_effect=[OSError(errno.EADDRINUSE, 'occupied'), object()]) as factory:
            local_runtime.bind_server(BaseHTTPRequestHandler)
            self.assertEqual(factory.call_args_list[0].args[0], ('127.0.0.1', 8765))
            self.assertEqual(factory.call_args_list[1].args[0], ('127.0.0.1', 0))

    def test_preferred_port_is_used_and_fallback_keeps_other_listener_alive(self):
        # Reserve an arbitrary port instead of interfering with the machine's 8765.
        probe = socket.socket()
        probe.bind((local_runtime.HOST, 0))
        preferred = probe.getsockname()[1]
        probe.close()
        first = local_runtime.bind_server(BaseHTTPRequestHandler, preferred)
        try:
            self.assertEqual(first.server_address, (local_runtime.HOST, preferred))
            second = local_runtime.bind_server(BaseHTTPRequestHandler, preferred)
            try:
                self.assertEqual(second.server_address[0], local_runtime.HOST)
                self.assertNotEqual(second.server_address[1], preferred)
                with socket.create_connection((local_runtime.HOST, preferred), timeout=2):
                    pass
            finally:
                second.server_close()
        finally:
            first.server_close()

    def test_other_bind_errors_are_not_masked(self):
        with patch.object(local_runtime, 'LocalServer', side_effect=PermissionError(13, 'denied')):
            with self.assertRaises(PermissionError):
                local_runtime.bind_server(BaseHTTPRequestHandler)

    def test_state_is_replaced_and_contains_only_local_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            previous = local_runtime.publish_state(root, 8765)
            current = local_runtime.publish_state(root, 8766)
            self.assertNotEqual(previous['nonce'], current['nonce'])
            self.assertEqual(json.loads((root / 'runtime.json').read_text()), current)
            self.assertEqual(set(current), {'pid', 'port', 'nonce'})
            self.assertEqual(sorted(p.name for p in root.iterdir()), ['runtime.json'])


if __name__ == '__main__':
    unittest.main()
