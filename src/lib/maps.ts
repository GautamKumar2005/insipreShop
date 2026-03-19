import axios from "axios";

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY as string;

export async function getDistance(
  origin: string,
  destination: string
) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

  const res = await axios.get(url, {
    params: {
      origins: origin,
      destinations: destination,
      key: GOOGLE_MAPS_KEY,
    },
  });

  return res.data;
}
