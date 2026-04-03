from .data import CARS, get_selected_criteria, honorable_miss_limit


def criterion_matches(car, criterion):
    criterion_id = criterion["id"]
    values = criterion["values"]
    if criterion_id == "year_range":
        return any(matches_year_range(car, value) for value in values)
    return car.get(criterion_id) in values


def matches_year_range(car, selected_range):
    decade_ranges = {
        "1970s": (1970, 1979),
        "1980s": (1980, 1989),
        "1990s": (1990, 1999),
        "2000s": (2000, 2009),
        "2010s": (2010, 2019),
        "2020s": (2020, 2029),
    }
    if selected_range in decade_ranges:
        start_year, end_year = decade_ranges[selected_range]
        return car["year_start"] <= end_year and car["year_end"] >= start_year
    return True


def format_years(car):
    start = car["year_start"]
    end = car["year_end"]
    return str(start) if start == end else f"{start}-{end}"


def score_car(car, criteria):
    matched = []
    missed = []

    for criterion in criteria:
        entry = {
            "label": criterion["label"],
            "selected": criterion["value_label"],
        }
        if criterion_matches(car, criterion):
            matched.append(entry)
        else:
            missed.append(entry)

    return {
        "car": car,
        "matched": matched,
        "missed": missed,
        "match_count": len(matched),
        "miss_count": len(missed),
    }


def build_results(answers):
    criteria = get_selected_criteria(answers)
    selected_count = len(criteria)
    scored_cars = [score_car(car, criteria) for car in CARS]
    scored_cars.sort(key=lambda item: (-item["match_count"], item["miss_count"], item["car"]["name"]))

    exact_matches = [item for item in scored_cars if item["miss_count"] == 0]
    recommendations = exact_matches
    exact_match_found = bool(exact_matches)

    if not exact_match_found and scored_cars:
        fewest_misses = min(item["miss_count"] for item in scored_cars)
        recommendations = [item for item in scored_cars if item["miss_count"] == fewest_misses]

    honorable_limit = honorable_miss_limit(selected_count)
    recommendation_names = {item["car"]["name"] for item in recommendations}
    honorable_mentions = [
        item
        for item in scored_cars
        if item["car"]["name"] not in recommendation_names
        and 0 < item["miss_count"] <= honorable_limit
    ][:4]

    excluded_names = recommendation_names | {item["car"]["name"] for item in honorable_mentions}
    more_options = [
        item for item in scored_cars
        if item["car"]["name"] not in excluded_names
    ]

    for item in recommendations + honorable_mentions + more_options:
        item["year_label"] = format_years(item["car"])

    return {
        "criteria": criteria,
        "selected_count": selected_count,
        "exact_match_found": exact_match_found,
        "recommendations": recommendations[:10],
        "honorable_mentions": honorable_mentions,
        "honorable_limit": honorable_limit,
        "more_options": more_options,
    }
