# https://hub.docker.com/_/influxdb/

docker pull influxdb
docker run -d -p 8086:8086 -v influxdb:/var/lib/influxdb influxdb -config ./influxdb.conf

# Run CLI
# docker exec -it 1e7d8824aca6 influx
