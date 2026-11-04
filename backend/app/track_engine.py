from typing import List
from .models import TrackPoint


def angle_delta(a: float, b: float) -> float:
    """Return the smallest angular difference between two headings."""
    return abs((b - a + 180) % 360 - 180)


def derive_track_features(points: List[TrackPoint]):
    if len(points) < 2:
        raise ValueError("At least two track points are required.")

    pts = sorted(points, key=lambda p: p.t)

    duration = pts[-1].t - pts[0].t

    # -------------------------------------------------------
    # Heading / manoeuvre analysis
    # -------------------------------------------------------
    heading_changes = []

    for prev, current in zip(pts[:-1], pts[1:]):
        heading_changes.append(
            angle_delta(
                prev.heading_deg,
                current.heading_deg
            )
        )

    significant_turns = sum(
        1
        for change in heading_changes
        if change >= 45
    )

    # -------------------------------------------------------
    # Shoreline approach analysis
    # -------------------------------------------------------
    approach_flags = []

    for prev, current in zip(pts[:-1], pts[1:]):
        reduction = (
            prev.shoreline_distance_m
            - current.shoreline_distance_m
        )

        approach_flags.append(reduction >= 25)

    approach_episodes = 0
    previous_approach = False

    for flag in approach_flags:
        if flag and not previous_approach:
            approach_episodes += 1

        previous_approach = flag

    # -------------------------------------------------------
    # Speed / persistence analysis
    # -------------------------------------------------------
    speeds = [p.speed_kmh for p in pts]

    max_speed = max(speeds)
    avg_speed = sum(speeds) / len(speeds)

    low_speed_fraction = (
        sum(1 for speed in speeds if speed <= 6)
        / len(speeds)
    )

    loitering = (
        duration >= 120
        and low_speed_fraction >= 0.50
    )

    # -------------------------------------------------------
    # Contact relationship analysis
    # -------------------------------------------------------
    nearby_contacts = max(
        p.nearby_contacts for p in pts
    )

    # -------------------------------------------------------
    # Derived behaviour events
    # -------------------------------------------------------
    behaviours = []

    if significant_turns >= 2:
        behaviours.append("repeated_turns")

    if approach_episodes >= 1:
        behaviours.append("shoreline_approach")

    if approach_episodes >= 2:
        behaviours.append("repeated_approach")

    if max_speed >= 22:
        behaviours.append("high_speed")

    if loitering:
        behaviours.append("loitering")

    dwell_seconds = int(duration) if loitering else 0

    return {
        "duration_seconds": round(duration, 1),
        "heading_changes_deg": [
            round(value, 1)
            for value in heading_changes
        ],
        "significant_turns": significant_turns,
        "shoreline_approach_episodes": approach_episodes,
        "max_speed_kmh": round(max_speed, 1),
        "average_speed_kmh": round(avg_speed, 1),
        "nearby_contacts": nearby_contacts,
        "dwell_seconds": dwell_seconds,
        "derived_behaviours": behaviours
    }
