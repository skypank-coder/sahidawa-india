from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.ml.src.image_compare import _load_reference_cache, router as image_compare_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_reference_cache()
    yield


app = FastAPI(
    title="SahiDawa ML Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    image_compare_router,
    prefix="/api/v1",
    tags=["image-compare"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
