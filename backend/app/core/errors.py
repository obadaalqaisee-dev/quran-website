"""Uniform JSON error responses.

Every error leaves the API as ``{"error": {"code": ..., "message": ...}}``.
Internal details and stack traces are logged, never returned.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("app.errors")

_HTTP_CODES = {
    400: "bad_request",
    404: "not_found",
    405: "method_not_allowed",
    422: "validation_error",
    429: "rate_limited",
    502: "upstream_error",
    503: "service_unavailable",
    504: "upstream_timeout",
}


class APIError(Exception):
    def __init__(self, status_code: int, message: str, code: str | None = None, headers: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code or _HTTP_CODES.get(status_code, "error")
        self.headers = headers


def error_body(code: str, message: str, details=None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def _api_error(_: Request, exc: APIError):
        return JSONResponse(error_body(exc.code, exc.message), status_code=exc.status_code, headers=exc.headers)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        code = _HTTP_CODES.get(exc.status_code, "error")
        message = exc.detail if isinstance(exc.detail, str) else code.replace("_", " ")
        return JSONResponse(
            error_body(code, message), status_code=exc.status_code, headers=getattr(exc, "headers", None)
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        details = [
            {"location": ".".join(str(p) for p in err.get("loc", ())), "message": err.get("msg", "")}
            for err in exc.errors()
        ]
        return JSONResponse(error_body("validation_error", "Invalid request parameters.", details), status_code=422)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):
        log.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(error_body("internal_error", "An unexpected error occurred."), status_code=500)
