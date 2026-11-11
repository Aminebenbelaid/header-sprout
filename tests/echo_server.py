"""Local-only manual extension test. Run, then visit http://127.0.0.1:8877/."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Echo(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"headers": dict(self.headers)}, indent=2).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Powered-By", "Header Sprout test server")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    print("Echo server: http://127.0.0.1:8877/ — Ctrl+C to stop")
    HTTPServer(("127.0.0.1", 8877), Echo).serve_forever()
