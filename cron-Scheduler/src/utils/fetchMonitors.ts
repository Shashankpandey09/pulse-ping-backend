import axios from "axios";
export async function* fetchMonitorsByIntervals(interval: number) {
  //creating a cursor pointer to keep track of last id
  let cursor: number | null = null;

  //iterating a infinite while loop to fetch until the all the monitors are fetched
  while (true) {
    const params: { interval: number; pageSize: number; cursor?: number } = {
      interval,
      pageSize: 500,
    };

    if (cursor !== null) {
      params.cursor = cursor;
    }
    const options = {
      //i can't send data directly with get request so passing the data as query params
      // which will be accessible in req.query
      params: params,
      headers: {
        "x-api-key": process.env.DB_SERVICE_API_KEY,
      },
    };
    try {
      const res = await axios.get(
        `${process.env.EXPRESS_APP_URL}/internal/monitors`,
        options
      );

      const { monitors, nextCursor } = res.data;
      if (!monitors || !Array.isArray(monitors) || monitors.length === 0) {
        // console.error("❌ `monitors` is not an array. Response might be malformed Or length of monitor is 0");
        console.log('breaking');
        break;
      }
      console.log(monitors, 'this is first monitor', nextCursor)
      for (const mon of monitors) yield JSON.stringify(mon);
      if (!nextCursor) {
        console.log("✅ No nextCursor. All data fetched.");
        break;
      }
      cursor = nextCursor;
    } catch (error) {
      console.log('catch exec', error);
      break;
    }
  }
}
