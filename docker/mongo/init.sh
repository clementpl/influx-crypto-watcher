CONTAINER_NAME="watchers-mongo"

docker pull mongo
docker run --name $CONTAINER_NAME -d mongo:latest
