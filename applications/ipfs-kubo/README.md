```
docker run -d --name ipfs_host \
  -v $(mktemp -d):/export \
  -v $(mktemp -d):/data/ipfs \
  -p 4001:4001 \
  -p 4001:4001/udp \
  -p 8080:8080 \
  -p 5001:5001 \
  ipfs/kubo:latest
```
