package com.pdks.backend.util;

public class GeoUtils {
    private static final int EARTH_RADIUS_METERS = 6371000;

    /**
     * Haversine formülü ile iki koordinat arasındaki mesafeyi metre cinsinden hesaplar.
     */
    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);

        double a = Math.pow(Math.sin(dLat / 2), 2) +
                   Math.pow(Math.sin(dLon / 2), 2) *
                   Math.cos(lat1) *
                   Math.cos(lat2);

        double c = 2 * Math.asin(Math.sqrt(a));

        return EARTH_RADIUS_METERS * c;
    }
}
