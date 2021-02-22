# goss-metrics-exporter

This project is capable of returning prometheus metrics for a running goss server.

## Usage

To make goss-metrics-exporter work, you will need one environment variables set: `GOSS_SERVER_URL`.

The `.env`:

```
GOSS_SERVER_URL=http://goss:8080
```

## Example Output

If you want to use docker-compose.yml to try it, use:

```yaml
version: "2.0"
services:
  goss-metrics-exporter:
    image: dracoblue/goss-metrics-exporter
    environment:
      - "GOSS_SERVER_URL=http://goss:8080"
    ports:
      - "9442:9442"
  goss:
    image: aelsabbahy/goss:latest
    command: "goss serve"
    ports:
      - "8080:8080"
    volumes:
      - './goss.yaml:/goss.yaml'
```

and put your `goss.yaml` in the very same directory. The goss response is available at <http://localhost:8080> and the 
prometheus metrics are available at <http://localhost:9442>.

If your goss server is running with
```
http:
  https://httpbin.org/get:
    status: 399
    method: GET
  https://httpbin.org/put:
    status: 200
    method: PUT
    request-body: '{"key": "value"}'
    title: "httpbin put"
    body:
      - '"key": "value"'
```

your goss serve /healthz endpoint is returning this data:

```
..F

Failures/Skipped:

HTTP: https://httpbin.org/get: status:
Expected
    <int>: 200
to equal
    <int>: 399

Total Duration: 0.583s
Count: 3, Failed: 1, Skipped: 0
```

and your metrics will look like this:

```text
# HELP goss_result goss result
# TYPE goss_result gauge
# HELP goss_duration_seconds goss duration
# TYPE goss_duration_seconds gauge
goss_result{property="status",resource_id="https://httpbin.org/get",resource_type="HTTP",result="failure"} 1
goss_duration_seconds{property="status",resource_id="https://httpbin.org/get",resource_type="HTTP",result="failure"} 0.2991657
goss_result{property="status",resource_id="https://httpbin.org/put",resource_type="HTTP",result="success",title="httpbin put"} 0
goss_duration_seconds{property="status",resource_id="https://httpbin.org/put",resource_type="HTTP",result="success",title="httpbin put"} 0.284177
goss_result{property="Body",resource_id="https://httpbin.org/put",resource_type="HTTP",result="success",title="httpbin put"} 0
goss_duration_seconds{property="Body",resource_id="https://httpbin.org/put",resource_type="HTTP",result="success",title="httpbin put"} 0.0001317
# HELP goss_failed_total goss failed tests
# TYPE goss_failed_total gauge
goss_failed_total 1
# HELP goss_successful_total goss successful tests
# TYPE goss_successful_total gauge
goss_successful_total 2
# HELP goss_skipped_total goss skipped tests
# TYPE goss_skipped_total gauge
goss_skipped_total 0
# HELP goss_duration_seconds_total goss total duration
# TYPE goss_duration_seconds_total gauge
goss_duration_seconds_total 0.5837744000000001
```
## Related projects

* [goss#362](https://github.com/aelsabbahy/goss/issues/362)
  - is not yet merged into goss
* [goss#175](https://github.com/aelsabbahy/goss/pull/175)
  - is closed and won't be merged

## License

This work is copyright by DracoBlue (http://dracoblue.net) and licensed under the terms of MIT License.
