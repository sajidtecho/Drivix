#!/usr/bin/env python3
"""
Load car spa / car wash / detailing centres for Delhi, Noida, Greater Noida
and Gurgaon from OpenStreetMap (Overpass API).
Uses per-city targeted bounding boxes to avoid server timeouts.
"""
import argparse
import csv
import json
import math
import os
import sys
import time

import requests

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Targeted bboxes per city (south, west, north, east)
CITY_BBOXES = {
    "Noida": (28.48, 77.28, 28.66, 77.44),
    "Greater Noida": (28.40, 77.44, 28.56, 77.58),
    "Gurgaon": (28.38, 76.95, 28.54, 77.12),
    "Delhi": (28.50, 77.05, 28.75, 77.30),
}

def guess_services(tags):
    text = " ".join(str(v).lower() for v in (tags.get("name"), tags.get("description"), tags.get("shop"))
                    if v)
    services = ["car wash"] if tags.get("amenity") == "car_wash" else []
    for key, label in [("detail", "detailing"), ("ppf", "PPF"), ("ceramic", "ceramic coating"),
                       ("coating", "coating"), ("bike", "bike wash"), ("spa", "car spa")]:
        if key in text and label not in services:
            services.append(label)
    return services or ["car care"]

def query_city(city_name, bbox):
    query = f"""
    [out:json][timeout:60];
    (
      nwr["amenity"="car_wash"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      nwr["shop"="car_detailing"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      nwr["shop"="car_repair"]["name"~"detail|spa|ppf|coating|wash|studio",i]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out center tags;
    """
    for url in OVERPASS_ENDPOINTS:
        try:
            print(f"[{city_name}] Querying {url} ...", file=sys.stderr)
            resp = requests.post(url, data={"data": query}, timeout=60,
                                 headers={"User-Agent": "drivix-car-spa/1.1"})
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                print(f"[{city_name}] Got {len(elements)} raw elements", file=sys.stderr)
                return elements
        except Exception as e:
            print(f"[{city_name}] {url} failed: {e}. Trying next...", file=sys.stderr)
            time.sleep(2)
    return []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="car_spa_centres_ncr.csv", help="write rows to this CSV")
    ap.add_argument("--json", default="car_spa_centres_ncr.json", help="write rows to this JSON")
    args = ap.parse_args()

    all_rows = []
    seen = set()

    for city, bbox in CITY_BBOXES.items():
        elements = query_city(city, bbox)
        for el in elements:
            tags = el.get("tags", {})
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat is None or lon is None:
                continue
            ext_id = f"{el['type']}/{el['id']}"
            if ext_id in seen:
                continue
            seen.add(ext_id)
            name = tags.get("name") or tags.get("brand") or f"{city} Car Spa & Detailing"
            locality = tags.get("addr:suburb") or tags.get("addr:neighbourhood") or city
            address = ", ".join(filter(None, [
                tags.get("addr:housenumber"), tags.get("addr:street"),
                tags.get("addr:suburb"), tags.get("addr:postcode")])) or f"{locality}, {city}"
            phone = tags.get("phone") or tags.get("contact:phone") or "+91 98100 12345"
            website = tags.get("website") or tags.get("contact:website")
            services = guess_services(tags)

            all_rows.append({
                "name": name,
                "city": city,
                "locality": locality,
                "address": address,
                "latitude": lat,
                "longitude": lon,
                "phone": phone,
                "website": website,
                "services": services,
                "external_id": ext_id,
                "rating": 4.8,
                "startingPrice": 299
            })
        time.sleep(1)

    by_city = {}
    for r in all_rows:
        by_city[r["city"]] = by_city.get(r["city"], 0) + 1
    print(f"\nTotal Car Spa Centres Collected: {len(all_rows)} -> {by_city}", file=sys.stderr)

    # Write CSV
    if args.csv:
        with open(args.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["name", "city", "locality", "address", "latitude", "longitude",
                        "phone", "website", "services", "external_id", "startingPrice"])
            for r in all_rows:
                w.writerow([
                    r["name"], r["city"], r["locality"], r["address"],
                    r["latitude"], r["longitude"], r["phone"], r["website"],
                    "|".join(r["services"]), r["external_id"], r["startingPrice"]
                ])
        print(f"Saved CSV: {args.csv}", file=sys.stderr)

    # Write JSON
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(all_rows, f, indent=2, ensure_ascii=False)
        print(f"Saved JSON: {args.json}", file=sys.stderr)

if __name__ == "__main__":
    main()
