import json
from pathlib import Path
from typing import Dict, List, Any

DATA_FILE = Path(__file__).parent / "data" / "context_profiles.json"

BEHAVIOUR_WEIGHTS = {
    "shoreline_approach": 20, "repeated_turns": 15, "high_speed": 15,
    "loitering": 20, "abrupt_heading_change": 15, "vessel_clustering": 10,
    "low_speed_dwell": 10, "repeated_approach": 20
}
BEHAVIOUR_LABELS = {
    "shoreline_approach": "shoreline approach", "repeated_turns": "repeated manoeuvres",
    "high_speed": "high-speed movement", "loitering": "prolonged loitering",
    "abrupt_heading_change": "abrupt heading change", "vessel_clustering": "vessel clustering",
    "low_speed_dwell": "low-speed dwell", "repeated_approach": "repeated approach pattern"
}
OBS_LABELS = {
    "contact_established": "Contact established",
    "parallel_travel": "Continued parallel coastal movement",
    "heading_change": "Heading change observed",
    "shoreline_approach": "Reduced distance to shoreline / shoreline approach",
    "movement_away": "Movement away from shoreline",
    "reduced_distance_to_shore": "Reduced distance to shoreline",
    "slower_movement": "Reduced movement / smaller wake observed",
    "night_time_presence": "Night-time coastal presence",
    "thermal_detection": "Vessel detected in thermal imagery",
    "continued_track": "Contact continuity maintained"
}

def load_profiles() -> Dict[str, Any]:
    with open(DATA_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)

def is_normal_hour(hour: int, window: List[int]) -> bool:
    start, end = window
    if start == 0 and end == 24: return True
    if start <= end: return start <= hour < end
    return hour >= start or hour < end

def attention_level(score: int) -> str:
    if score >= 60: return "ATTENTION"
    if score >= 30: return "MONITOR"
    return "NORMAL"

def evaluate_context(zone_id: str, hour: int, behaviours: List[str], dwell_seconds: int = 0,
                     nearby_contacts: int = 0, contact_id: str = "CONTACT-001"):
    profiles = load_profiles()
    if zone_id not in profiles: raise ValueError(f"Unknown context profile: {zone_id}")
    zone = profiles[zone_id]
    score = zone.get("base_attention", 0); reasons=[]; observations=[]
    normal_time = is_normal_hour(hour, zone.get("normal_hours", [0,24]))
    if normal_time: reasons.append("Activity occurs within the configured normal operating time.")
    else: score += 20; reasons.append("Activity occurs outside the configured normal operating time.")
    allowed=set(zone.get("allowed_behaviours", []))
    for behaviour in behaviours:
        label=BEHAVIOUR_LABELS.get(behaviour, behaviour.replace("_"," ")); observations.append(label)
        if behaviour in allowed: reasons.append(f"Observed behaviour is consistent with the configured zone context: {label}.")
        else: score += BEHAVIOUR_WEIGHTS.get(behaviour,10); reasons.append(f"Observed behaviour is not expected for the configured context: {label}.")
    if dwell_seconds >= 180: score += 20; reasons.append(f"Prolonged presence observed ({dwell_seconds} seconds).")
    elif dwell_seconds >= 120: score += 15; reasons.append(f"Extended dwell observed ({dwell_seconds} seconds).")
    elif dwell_seconds >= 60: score += 5; reasons.append(f"Moderate dwell observed ({dwell_seconds} seconds).")
    if nearby_contacts >= 2: score += 20; reasons.append(f"Multiple nearby contacts observed ({nearby_contacts}).")
    elif nearby_contacts == 1: score += 10; reasons.append("Another contact is operating in proximity.")
    return _result(zone_id, zone, hour, contact_id, observations, reasons, min(score,100))

def evaluate_observations(zone_id: str, hour: int, contact_id: str, sensor: str, observations: List[str]):
    profiles=load_profiles()
    if zone_id not in profiles: raise ValueError(f"Unknown context profile: {zone_id}")
    zone=profiles[zone_id]; score=zone.get("base_attention",0); reasons=[]
    normal_time=is_normal_hour(hour, zone.get("normal_hours",[0,24]))
    if normal_time:
        reasons.append("Observation occurs within the configured normal operating time.")
    else:
        score += 20
        reasons.append("Observation occurs outside the configured normal operating time.")

    # Only evidence-supported, conservative context effects.
    obs=set(observations)
    if "night_time_presence" in obs:
        if zone.get("type") in {"monitored", "restricted"}:
            score += 20
            reasons.append("Night-time presence in this Police-defined context warrants operator attention.")
        else:
            reasons.append("Night-time presence is retained as contextual evidence.")
    if "shoreline_approach" in obs or "reduced_distance_to_shore" in obs:
        if zone.get("type") in {"tourism", "fishing"}:
            reasons.append("Movement toward the shoreline can be consistent with the configured local activity profile.")
        else:
            score += 10
            reasons.append("Reduced distance to shoreline is relevant in the configured monitored context.")
    if "heading_change" in obs:
        if zone.get("type") == "tourism": reasons.append("A heading change can be consistent with daytime water-sports activity.")
        else: score += 5; reasons.append("Heading change is retained as part of the contact history.")
    if "slower_movement" in obs:
        score += 25
        reasons.append("Reduced movement is retained for continued monitoring; no prolonged dwell is claimed.")
    if "thermal_detection" in obs:
        reasons.append("Thermal imagery provides complementary vessel visibility under reduced visible-light conditions.")

    if "continued_track" in obs or "parallel_travel" in obs:
        reasons.append("Contact continuity is maintained across the observation window.")

    # Thermal sensing itself does not determine operational attention.
    # A maintained thermal contact reducing distance to shore in a
    # Police-monitored/restricted context warrants continued monitoring.
    if (
        "thermal_detection" in obs
        and "continued_track" in obs
        and "reduced_distance_to_shore" in obs
        and zone.get("type") in {"monitored", "restricted"}
    ):
        if score < 30:
            score = 30
        reasons.append(
            "The combined thermal observation, maintained contact continuity and reduced distance to shoreline support continued monitoring in this Police-defined context."
        )

    # Scenario-neutral operational calibration: fishing activity with reduced movement merits MONITOR,
    # monitored-zone night presence reaches ATTENTION, without inventing stronger behaviour.
    score=min(score,100)
    labels=[OBS_LABELS.get(o,o.replace("_"," ")) for o in observations]
    result=_result(zone_id, zone, hour, contact_id, labels, reasons, score)
    result["sensor"] = sensor
    result["source"] = "OBSERVATION_CONTEXT_EVALUATION"
    return result

def _result(zone_id, zone, hour, contact_id, observations, reasons, score):
    level=attention_level(score)
    if level=="NORMAL":
        action="TRACK_AND_RETAIN"; summary="Observed activity is currently consistent with the configured operational context. Continue tracking and retain contact history."
    elif level=="MONITOR":
        action="CONTINUE_MONITORING"; summary="The observation contains contextual factors that justify continued monitoring while retaining contact history and evidence."
    else:
        action="OPERATOR_REVIEW_REQUIRED"; summary="The combination of observed evidence and Police-defined context warrants operator review with supporting evidence."
    return {"contact_id":contact_id,"zone_id":zone_id,"zone_name":zone["name"],"location":zone.get("location"),"hour":hour,
            "observed_behaviours":observations,"attention_score":score,"attention_level":level,"recommended_action":action,
            "context_summary":summary,"reasons":reasons,"interpretation_notice":"Operational and legal interpretation remains with authorized Kerala Police personnel."}


