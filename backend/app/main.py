from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import ContextEvaluationRequest, AutomatedTrackRequest, ObservationEvaluationRequest
from .context_engine import evaluate_context, evaluate_observations, load_profiles
from .track_engine import derive_track_features

app=FastAPI(title="SmartQEye Coastal Context Engine",version="0.3.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://127.0.0.1:5177","http://localhost:5177","http://localhost:8080","http://127.0.0.1:8080","http://localhost:80","http://127.0.0.1:80"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

@app.get("/health")
def health(): return {"status":"ok","service":"SmartQEye Coastal Context Engine","version":"0.3.0"}
@app.get("/api/context/profiles")
def get_profiles(): return load_profiles()
@app.post("/api/context/evaluate")
def context_evaluate(req: ContextEvaluationRequest):
    try: return evaluate_context(req.zone_id,req.hour,req.behaviours,req.dwell_seconds,req.nearby_contacts,req.contact_id)
    except ValueError as exc: raise HTTPException(status_code=400,detail=str(exc))
@app.post("/api/track/evaluate")
def track_evaluate(req: AutomatedTrackRequest):
    try:
        features=derive_track_features(req.points)
        context=evaluate_context(req.zone_id,req.hour,features["derived_behaviours"],features["dwell_seconds"],features["nearby_contacts"],req.contact_id)
        return {"source":"AUTOMATED_TRACK_DERIVATION","contact_id":req.contact_id,"derived_features":features,"context":context}
    except ValueError as exc: raise HTTPException(status_code=400,detail=str(exc))
@app.post("/api/observation/evaluate")
def observation_evaluate(req: ObservationEvaluationRequest):
    try: return evaluate_observations(req.zone_id,req.hour,req.contact_id,req.sensor,req.observations)
    except ValueError as exc: raise HTTPException(status_code=400,detail=str(exc))
