import { useEffect, useState } from "react";

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy: number;
}

export type GeoStatus = "idle" | "prompt" | "granted" | "denied" | "unavailable" | "error";

export interface GeoState {
  fix: GeoFix | null;
  status: GeoStatus;
  error: string | null;
}

export function useWatchPosition(): GeoState {
  const [state, setState] = useState<GeoState>({
    fix: null,
    status: "idle",
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ fix: null, status: "unavailable", error: "Geolocation not supported" });
      return;
    }
    setState((s) => ({ ...s, status: "prompt" }));
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          fix: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          status: "granted",
          error: null,
        });
      },
      (err) => {
        setState({
          fix: null,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          error: err.message,
        });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}
